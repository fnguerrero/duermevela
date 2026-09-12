# Tanda 9 — diez mejoras

Nico pidió diez mejoras sin decir cuáles. Las elegí con tres criterios, en este
orden: lo que él había señalado y quedó sin hacer; lo que el juego dice mal o
dice dos veces; y lo que se va a romper en el celular de Bel y ninguna prueba
mira.

## Lo que se hizo

**A1** · La luna decía lo que ya decía el platillo. Ahora dice lo suyo: la que
lee de lejos no puede leer lo que tiene encima.
**A2** · La lectura de *La Que Se Despierta* no coincidía con su párrafo.
**A3** · El número se decía dos veces en el cierre; se fue el aviso duplicado y
con él veinte líneas de CSS muerto.
**B1/B2** · `verificarCuadros()`: cuadros por segundo por lugar, con y sin la
anomalía revelada. No existía. Encontró el platillo a 4 fps y el círculo a 19.
**B3** · El cierre entero en 375x812, con 0 y con 8 indicios.
**B4** *(apareció al mirar la captura)* · "Viste 8 de las ocho": el número va en
palabras, y con cuatro de ocho ya no dice "se te fue casi todo".
**C1** · Etiquetas sociales: el link llegaba a WhatsApp como texto azul.
**C2** · `prefers-reduced-motion` en el canvas, más `?calma=1`.
**D1** · El aviso del instante ocupaba el 92% del ancho.
**D2** · Ella, en la cama, terminaba en una cuña.

## Números

| | antes | después |
|---|---|---|
| platillo revelado | 254 ms · 4 fps | 6,3 ms · 159 fps |
| círculo | 37 / 55 ms | 7,3 / 9,1 ms |
| lugar más lento | 4 fps | 106 fps |
| aviso, ancho en 375px | 92% en una línea | 63% en dos |
| zoom del clímax con calma | 22,5 px | 5,6 px |

Verificación final: `auditarTodo()` 16 de 16, partida completa en el index y en
el bundle, cero desbordes en 390x760, 375x812, 812x375, 1395x920 y 1532x783.

## Lo que NO quedó, y por qué

Escribí `verificarCama()` para medir que la piel no terminara en punta y **no
distinguía**: 3 píxeles de última fila con el defecto puesto y 3 sin él. Probé
otras dos métricas (cuánto se estira la mancha respecto de su centro de masa,
cuánta piel queda sobre la tela) y tampoco. Al tamaño en que el juego se juega,
la cabeza mide quince píxeles y las dos versiones son casi idénticas: el defecto
existe al ampliar. Una prueba que da lo mismo con el bug puesto y sacado no
protege nada, así que se sacó y quedó escrito en el código.

## Desvíos

Ninguno respecto de lo planificado. Dos ítems se agregaron sobre la marcha (B4 y
la guarda de `verificarAviso` contra la ventana en cero, que dio tres rojos
falsos dentro de la auditoría porque el panel oculto deja `innerWidth` en 0).

## Pendiente que sigue abierto

- Nico nunca jugó el juego entero de punta a punta.
- Despublicar `el-instante-psicodelico`, que tiene una versión vieja en Pages.
- `publicar/` quedó actualizado para Netlify Drop; está fuera de git a propósito.
