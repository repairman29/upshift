import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;
let dependencyTreeProvider: DependencyTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log("Upshift extension activated");

  // Create diagnostic collection for inline warnings
  diagnosticCollection = vscode.languages.createDiagnosticCollection("upshift");
  context.subscriptions.push(diagnosticCollection);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "upshift.scan";
  statusBarItem.text = "$(package) Upshift";
  statusBarItem.tooltip = "Click to scan dependencies";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Create tree view
  dependencyTreeProvider = new DependencyTreeProvider();
  vscode.window.registerTreeDataProvider(
    "upshiftDependencies",
    dependencyTreeProvider
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("upshift.scan", scanCommand),
    vscode.commands.registerCommand("upshift.explain", explainCommand),
    vscode.commands.registerCommand("upshift.upgrade", upgradeCommand),
    vscode.commands.registerCommand("upshift.upgradeAll", upgradeAllCommand),
    vscode.commands.registerCommand("upshift.audit", auditCommand)
  );

  // Auto-scan on activation if enabled
  const config = vscode.workspace.getConfiguration("upshift");
  if (config.get("autoScan")) {
    scanCommand();
  }

  // Watch for package.json changes
  const watcher = vscode.workspace.createFileSystemWatcher("**/package.json");
  watcher.onDidChange(() => {
    const config = vscode.workspace.getConfiguration("upshift");
    if (config.get("autoScan")) {
      scanCommand();
    }
  });
  context.subscriptions.push(watcher);
}

export function deactivate() {
  diagnosticCollection?.dispose();
  statusBarItem?.dispose();
}

async function scanCommand() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showWarningMessage("No workspace folder open");
    return;
  }

  statusBarItem.text = "$(sync~spin) Scanning...";

  try {
    const { stdout } = await execAsync("upshift scan --json", {
      cwd: workspaceFolder.uri.fsPath,
    });

    const result = JSON.parse(stdout);
    const outdated = result.outdated || [];
    const vulns = result.vulnerabilities?.items || [];

    // Update status bar
    const outdatedCount = outdated.length;
    const vulnCount = vulns.length;

    if (vulnCount > 0) {
      statusBarItem.text = `$(warning) ${vulnCount} vulnerabilities`;
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else if (outdatedCount > 0) {
      statusBarItem.text = `$(package) ${outdatedCount} outdated`;
      statusBarItem.backgroundColor = undefined;
    } else {
      statusBarItem.text = "$(check) Up to date";
      statusBarItem.backgroundColor = undefined;
    }

    // Update tree view
    dependencyTreeProvider.refresh(outdated, vulns);

    // Update diagnostics in package.json
    await updateDiagnostics(workspaceFolder.uri.fsPath, outdated, vulns);

    vscode.window.showInformationMessage(
      `Upshift: ${outdatedCount} outdated, ${vulnCount} vulnerabilities`
    );
  } catch (error) {
    statusBarItem.text = "$(error) Scan failed";
    const message = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(`Upshift scan failed: ${message}`);
  }
}

async function explainCommand() {
  const packageName = await vscode.window.showInputBox({
    prompt: "Enter package name to explain",
    placeHolder: "e.g., react, express",
  });

  if (!packageName) return;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const useAI = await vscode.window.showQuickPick(["No (free)", "Yes (1 credit)"], {
    placeHolder: "Use AI for deep analysis?",
  });

  const aiFlag = useAI?.includes("Yes") ? " --ai" : "";

  const terminal = vscode.window.createTerminal("Upshift");
  terminal.sendText(`upshift explain ${packageName}${aiFlag}`);
  terminal.show();
}

async function upgradeCommand() {
  const packageName = await vscode.window.showInputBox({
    prompt: "Enter package name to upgrade",
    placeHolder: "e.g., react, express",
  });

  if (!packageName) return;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const terminal = vscode.window.createTerminal("Upshift");
  terminal.sendText(`upshift upgrade ${packageName}`);
  terminal.show();
}

async function upgradeAllCommand() {
  const mode = await vscode.window.showQuickPick(
    [
      { label: "Safe (minor + patch)", value: "--all-minor" },
      { label: "Patch only", value: "--all-patch" },
      { label: "Everything (including major)", value: "--all" },
    ],
    { placeHolder: "Select upgrade mode" }
  );

  if (!mode) return;

  const terminal = vscode.window.createTerminal("Upshift");
  terminal.sendText(`upshift upgrade ${mode.value}`);
  terminal.show();
}

async function auditCommand() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const useAI = await vscode.window.showQuickPick(
    ["No (free)", "Yes - get AI remediation plan (2 credits)"],
    { placeHolder: "Use AI for remediation suggestions?" }
  );

  const aiFlag = useAI?.includes("Yes") ? " --ai" : "";

  const terminal = vscode.window.createTerminal("Upshift");
  terminal.sendText(`upshift audit${aiFlag}`);
  terminal.show();
}

async function updateDiagnostics(
  workspacePath: string,
  outdated: any[],
  vulns: any[]
) {
  const config = vscode.workspace.getConfiguration("upshift");
  if (!config.get("showInlineWarnings")) return;

  const packageJsonPath = vscode.Uri.file(`${workspacePath}/package.json`);
  const document = await vscode.workspace.openTextDocument(packageJsonPath);
  const text = document.getText();

  const diagnostics: vscode.Diagnostic[] = [];

  // Add diagnostics for outdated packages
  for (const pkg of outdated) {
    const regex = new RegExp(`"${pkg.name}"\\s*:\\s*"[^"]+"`);
    const match = text.match(regex);

    if (match && match.index !== undefined) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      const isVuln = vulns.some((v) => v.name === pkg.name);
      const severity = isVuln
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;

      const message = isVuln
        ? `${pkg.name}: Security vulnerability! Update ${pkg.current} → ${pkg.latest}`
        : `${pkg.name}: Update available ${pkg.current} → ${pkg.latest}`;

      const diagnostic = new vscode.Diagnostic(range, message, severity);
      diagnostic.source = "Upshift";
      diagnostic.code = isVuln ? "vulnerability" : "outdated";

      diagnostics.push(diagnostic);
    }
  }

  diagnosticCollection.set(packageJsonPath, diagnostics);
}

// Tree View Provider
class DependencyTreeProvider
  implements vscode.TreeDataProvider<DependencyItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    DependencyItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private outdated: any[] = [];
  private vulns: any[] = [];

  refresh(outdated: any[], vulns: any[]) {
    this.outdated = outdated;
    this.vulns = vulns;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DependencyItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DependencyItem): DependencyItem[] {
    if (element) return [];

    const items: DependencyItem[] = [];

    // Vulnerabilities first
    const vulnNames = new Set(this.vulns.map((v) => v.name));
    const withVulns = this.outdated.filter((p) => vulnNames.has(p.name));
    const withoutVulns = this.outdated.filter((p) => !vulnNames.has(p.name));

    for (const pkg of withVulns) {
      items.push(
        new DependencyItem(
          pkg.name,
          `${pkg.current} → ${pkg.latest}`,
          true,
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    for (const pkg of withoutVulns) {
      items.push(
        new DependencyItem(
          pkg.name,
          `${pkg.current} → ${pkg.latest}`,
          false,
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    return items;
  }
}

class DependencyItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly hasVuln: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.description = version;
    this.tooltip = hasVuln
      ? `${name} has security vulnerabilities!`
      : `${name} can be updated`;
    this.iconPath = hasVuln
      ? new vscode.ThemeIcon("warning", new vscode.ThemeColor("errorForeground"))
      : new vscode.ThemeIcon("package");
    this.contextValue = "dependency";
  }
}
