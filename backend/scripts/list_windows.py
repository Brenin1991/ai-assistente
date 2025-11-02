#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json

def list_windows():
    """
    Lista todas as janelas abertas
    """
    try:
        import pygetwindow as gw
        
        windows = []
        for window in gw.getAllWindows():
            if window.title.strip():  # Ignorar janelas sem título
                windows.append({
                    'title': window.title,
                    'left': window.left,
                    'top': window.top,
                    'width': window.width,
                    'height': window.height,
                    'isMinimized': window.isMinimized,
                    'isMaximized': window.isMaximized,
                    'isActive': window.isActive
                })
        
        if windows:  # Se conseguiu listar janelas
            return windows
        else:
            raise Exception("Nenhuma janela encontrada com pygetwindow")
        
    except (ImportError, Exception):
        # Fallback: usar PowerShell
        try:
            import subprocess
            
            ps_command = """
            Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            using System.Text;
            public class Win32 {
                [DllImport("user32.dll")]
                public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
                [DllImport("user32.dll")]
                public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
                [DllImport("user32.dll")]
                public static extern int GetWindowTextLength(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool IsWindowVisible(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
                [DllImport("user32.dll")]
                public static extern bool IsIconic(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool IsZoomed(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
                
                public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
                
                [StructLayout(LayoutKind.Sequential)]
                public struct RECT {
                    public int Left;
                    public int Top;
                    public int Right;
                    public int Bottom;
                }
            }
"@

            $windows = @()
            [Win32]::EnumWindows({
                param($hWnd, $lParam)
                if ([Win32]::IsWindowVisible($hWnd)) {
                    $length = [Win32]::GetWindowTextLength($hWnd)
                    if ($length -gt 0) {
                        $title = New-Object System.Text.StringBuilder -ArgumentList ($length + 1)
                        [Win32]::GetWindowText($hWnd, $title, $title.Capacity) | Out-Null
                        $windowTitle = $title.ToString()
                        
                        # Filtrar janelas vazias ou do sistema
                        if ($windowTitle -ne "" -and $windowTitle -notlike "*Default IME*" -and $windowTitle -notlike "*MSCTFIME UI*") {
                            $rect = New-Object Win32+RECT
                            [Win32]::GetWindowRect($hWnd, [ref]$rect) | Out-Null
                            $isMinimized = [Win32]::IsIconic($hWnd)
                            $isMaximized = [Win32]::IsZoomed($hWnd)
                            $isActive = $hWnd -eq [Win32]::GetForegroundWindow()
                            
                            $windows += @{
                                title = $windowTitle
                                left = $rect.Left
                                top = $rect.Top
                                width = $rect.Right - $rect.Left
                                height = $rect.Bottom - $rect.Top
                                isMinimized = $isMinimized
                                isMaximized = $isMaximized
                                isActive = $isActive
                            }
                        }
                    }
                }
                return $true
            }, 0)

            if ($windows.Count -eq 0) {
                $windows = @(
                    @{ title = "Nenhuma janela visível encontrada"; left = 0; top = 0; width = 0; height = 0; isMinimized = $false; isMaximized = $false; isActive = $false }
                )
            }

            $windows | ConvertTo-Json -Depth 3
            """
            
            result = subprocess.run(['powershell', '-Command', ps_command], 
                                  capture_output=True, text=True, check=True)
            
            windows_data = json.loads(result.stdout)
            
            # Se não encontrou janelas, retornar uma lista vazia
            if not windows_data or (len(windows_data) == 1 and "Nenhuma janela" in windows_data[0].get('title', '')):
                return []
            
            return windows_data
            
        except Exception as e:
            return [{"error": f"Erro ao listar janelas: {str(e)}"}]
    
    except Exception as e:
        return [{"error": f"Erro ao listar janelas: {str(e)}"}]

if __name__ == "__main__":
    windows = list_windows()
    print(json.dumps(windows, indent=2, ensure_ascii=False))
