#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import subprocess
import os

def run_command(command):
    """
    Executa um comando do sistema
    """
    try:
        # Executar comando
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=30,  # Timeout de 30 segundos
            cwd=os.getcwd()
        )
        
        output = result.stdout.strip()
        error = result.stderr.strip()
        
        if result.returncode == 0:
            return f"Comando executado com sucesso:\n{output}" if output else "Comando executado com sucesso"
        else:
            return f"Erro ao executar comando (código {result.returncode}):\n{error if error else output}"
            
    except subprocess.TimeoutExpired:
        return "Comando expirou (timeout de 30 segundos)"
    except Exception as e:
        return f"Erro ao executar comando: {str(e)}"

def run_powershell_command(command):
    """
    Executa um comando PowerShell
    """
    try:
        result = subprocess.run(
            ['powershell', '-Command', command],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        output = result.stdout.strip()
        error = result.stderr.strip()
        
        if result.returncode == 0:
            return f"Comando PowerShell executado:\n{output}" if output else "Comando PowerShell executado"
        else:
            return f"Erro no PowerShell (código {result.returncode}):\n{error if error else output}"
            
    except subprocess.TimeoutExpired:
        return "Comando PowerShell expirou (timeout de 30 segundos)"
    except Exception as e:
        return f"Erro ao executar comando PowerShell: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python run_command.py <command>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Se o comando começar com 'ps:', executar como PowerShell
    if command.startswith('ps:'):
        command = command[3:]  # Remover 'ps:' do início
        result = run_powershell_command(command)
    else:
        result = run_command(command)
    
    print(result)
