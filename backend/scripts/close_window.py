#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys

def close_window(window_title):
    """
    Fecha uma janela pelo título
    """
    try:
        import pygetwindow as gw
        
        # Procurar janela pelo título (busca parcial)
        windows = gw.getWindowsWithTitle(window_title)
        
        if not windows:
            # Tentar busca mais ampla
            all_windows = gw.getAllWindows()
            windows = [w for w in all_windows if window_title.lower() in w.title.lower()]
        
        if windows:
            for window in windows:
                if window.title.strip():
                    window.close()
                    return f"Janela '{window.title}' fechada com sucesso"
            
            return f"Nenhuma janela com título '{window_title}' encontrada"
        else:
            return f"Nenhuma janela com título '{window_title}' encontrada"
            
    except ImportError:
        # Fallback: usar PowerShell
        try:
            import subprocess
            
            ps_command = f"""
            Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            using System.Text;
            public class Win32 {{
                [DllImport("user32.dll")]
                public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
                [DllImport("user32.dll")]
                public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
                [DllImport("user32.dll")]
                public static extern int GetWindowTextLength(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool IsWindowVisible(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool CloseWindow(IntPtr hWnd);
                [DllImport("user32.dll")]
                public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
                
                public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
                
                const uint WM_CLOSE = 0x0010;
            }}
"@

            $targetTitle = "{window_title}"
            $found = $false
            
            [Win32]::EnumWindows({{
                param($hWnd, $lParam)
                if ([Win32]::IsWindowVisible($hWnd)) {{
                    $length = [Win32]::GetWindowTextLength($hWnd)
                    if ($length -gt 0) {{
                        $title = New-Object System.Text.StringBuilder -ArgumentList ($length + 1)
                        [Win32]::GetWindowText($hWnd, $title, $title.Capacity) | Out-Null
                        $windowTitle = $title.ToString()
                        
                        if ($windowTitle -like "*$targetTitle*") {{
                            [Win32]::PostMessage($hWnd, [Win32]::WM_CLOSE, 0, 0)
                            $found = $true
                            Write-Host "Janela '$windowTitle' fechada"
                        }}
                    }}
                }}
                return $true
            }}, 0)

            if (-not $found) {{
                Write-Host "Nenhuma janela com título '$targetTitle' encontrada"
            }}
            """
            
            result = subprocess.run(['powershell', '-Command', ps_command], 
                                  capture_output=True, text=True, check=True)
            
            return result.stdout.strip() or f"Tentativa de fechar janela '{window_title}'"
            
        except Exception as e:
            return f"Erro ao fechar janela: {str(e)}"
    
    except Exception as e:
        return f"Erro ao fechar janela: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python close_window.py <window_title>")
        sys.exit(1)
    
    window_title = sys.argv[1]
    result = close_window(window_title)
    print(result)
