#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para instalar dependências Python para reconhecimento de voz
"""

import subprocess
import sys

def install_package(package):
    """Instala um pacote Python"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f" {package} instalado com sucesso")
        return True
    except subprocess.CalledProcessError as e:
        print(f" Erro ao instalar {package}: {e}")
        return False

def main():
    print(" Instalando dependências Python para reconhecimento de voz...")
    
    packages = [
        "SpeechRecognition",
        "pyaudio", 
        "pyttsx3"
    ]
    
    success_count = 0
    
    for package in packages:
        if install_package(package):
            success_count += 1
    
    print(f"\n Resumo: {success_count}/{len(packages)} pacotes instalados")
    
    if success_count == len(packages):
        print(" Todas as dependências foram instaladas com sucesso!")
        print("\n Próximos passos:")
        print("1. Reinicie o backend: npm start")
        print("2. Teste o reconhecimento de voz no frontend")
    else:
        print("  Algumas dependências falharam. Verifique os erros acima.")
        print("\n Dicas:")
        print("- Certifique-se de que o Python está instalado")
        print("- Execute como administrador se necessário")
        print("- Para PyAudio, pode ser necessário instalar manualmente")

if __name__ == "__main__":
    main()
