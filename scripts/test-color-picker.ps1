# Test color picker - gets pixel color at cursor position
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Drawing;

public class PixelColor {
    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hwnd);
    
    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hwnd, IntPtr hdc);
    
    [DllImport("gdi32.dll")]
    public static extern uint GetPixel(IntPtr hdc, int x, int y);
    
    public static int[] GetColorAt(int x, int y) {
        IntPtr hdc = GetDC(IntPtr.Zero);
        uint pixel = GetPixel(hdc, x, y);
        ReleaseDC(IntPtr.Zero, hdc);
        int r = (int)(pixel & 0x000000FF);
        int g = (int)(pixel & 0x0000FF00) >> 8;
        int b = (int)(pixel & 0x00FF0000) >> 16;
        return new int[] { r, g, b };
    }
}
"@

$pos = [System.Windows.Forms.Cursor]::Position
$rgb = [PixelColor]::GetColorAt($pos.X, $pos.Y)
$hex = '#{0:X2}{1:X2}{2:X2}' -f $rgb[0], $rgb[1], $rgb[2]

$result = @{
    x = $pos.X
    y = $pos.Y
    r = $rgb[0]
    g = $rgb[1]
    b = $rgb[2]
    hex = $hex
}

$result | ConvertTo-Json -Compress
