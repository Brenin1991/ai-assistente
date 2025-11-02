#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import time
import json

def focus_window(window_title):
    """
    Foca em uma janela específica
    """
    try:
        import pygetwindow as gw
        
        # Encontrar a janela
        target_window = None
        for window in gw.getAllWindows():
            if window.title and window.visible:
                # Busca mais flexível - normalizar strings
                window_title_normalized = window_title.lower().strip()
                window_title_actual = window.title.lower().strip()
                
                if (window_title_normalized in window_title_actual or 
                    window_title_actual in window_title_normalized or
                    'paint' in window_title_actual and 'paint' in window_title_normalized):
                    target_window = window
                    break
        
        if not target_window:
            return {"success": False, "error": f"Janela '{window_title}' não encontrada"}
        
        # Restaurar se estiver minimizada
        if target_window.isMinimized:
            target_window.restore()
            time.sleep(0.5)
        
        # Focar na janela
        target_window.activate()
        time.sleep(0.3)
        
        return {
            "success": True,
            "message": f"Foco direcionado para '{target_window.title}'",
            "window_title": target_window.title
        }
        
    except ImportError as e:
        return {"success": False, "error": f"Biblioteca necessária não encontrada: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Erro ao focar na janela: {e}"}

def list_windows():
    """
    Lista todas as janelas disponíveis para foco
    """
    try:
        import pygetwindow as gw
        
        windows = []
        for window in gw.getAllWindows():
            if window.title and window.visible and not window.isMinimized:
                windows.append({
                    "title": window.title,
                    "left": window.left,
                    "top": window.top,
                    "width": window.width,
                    "height": window.height
                })
        
        return {
            "success": True,
            "windows": windows
        }
        
    except ImportError as e:
        return {"success": False, "error": f"Biblioteca necessária não encontrada: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Erro ao listar janelas: {e}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Parâmetros insuficientes"}))
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "focus":
        # Parâmetros: window_title
        window_title = sys.argv[2] if len(sys.argv) > 2 else None
        
        if not window_title:
            print(json.dumps({"success": False, "error": "Título da janela é obrigatório"}))
        else:
            result = focus_window(window_title)
            print(json.dumps(result))
    
    elif action == "list_windows":
        result = list_windows()
        print(json.dumps(result))
    
    else:
        print(json.dumps({"success": False, "error": f"Ação '{action}' não reconhecida"}))
