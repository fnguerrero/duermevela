#!/usr/bin/env python3
"""Sube la version de los scripts, para que nadie se quede con una copia vieja.

    py -3 tools/version.py         -> incrementa en 1
    py -3 tools/version.py 12      -> fija la version 12

El juego se publica en GitHub Pages y se abre desde el celular, donde el
navegador cachea los .js con ganas: Nico probo un arreglo en el telefono, lo
vio igual, y los cinco cambios YA estaban publicados — era su cache. El riesgo
de verdad no es ese: es que Bel abra el juego una vez, se quede con esa copia y
no vea nunca ninguna correccion.

El bundle de dist/ no necesita nada de esto, porque es un archivo unico: al
cambiar el HTML cambia todo. Esto es para index.html, que carga trece scripts
sueltos.
"""
import io
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(BASE, 'index.html')


def leer():
    return io.open(ARCHIVO, encoding='utf-8').read()


def escribir(texto):
    io.open(ARCHIVO, 'w', encoding='utf-8', newline='').write(texto)


def version_actual(html):
    hallado = re.search(r'<script src="js/[^"]+\?v=(\d+)"', html)
    return int(hallado.group(1)) if hallado else 0


def main():
    html = leer()
    ahora = version_actual(html)
    nueva = int(sys.argv[1]) if len(sys.argv) > 1 else ahora + 1

    # Con o sin ?v= previo: la expresion se queda con el nombre del archivo.
    html, cuantos = re.subn(
        r'<script src="(js/[^"?]+)(?:\?v=\d+)?"',
        lambda m: '<script src="%s?v=%d"' % (m.group(1), nueva),
        html)

    if not cuantos:
        raise SystemExit('no se encontro ningun script en index.html')

    escribir(html)
    print('version %d -> %d  (%d scripts)' % (ahora, nueva, cuantos))


if __name__ == '__main__':
    main()
