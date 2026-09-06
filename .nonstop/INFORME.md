# Informe — tanda 8: lo que quedó abierto

Veintisiete iteraciones, #221 a #247, sobre un presupuesto de 40.

## Qué se hizo

**El faro tenía dos lámparas.** Era lo único que Nico había señalado y no se
había resuelto: "son como dos haz de luz diferente, uno el que le da a Bel todo
el tiempo y otro el que gira constantemente". Y eran dos de verdad — el pintor
barría su haz y la anomalía dibujaba encima un cono fijo. Ahora el haz que barre
es el que se queda: frena por el camino corto, se inclina hasta el piso donde
ella está y se cierra, porque apuntar es abrirse menos.

**Tres lugares donde ella no estaba.** El pendiente decía "cinco lugares sin
recuerdo propio" y estaba mal anotado por mí. Contando las marcas de primera
persona en cada texto de llegada, los que dejaban a Bel afuera eran otros: el
platillo, el agua y los pájaros, tres escenas descriptas como por una cámara.
Una frase para cada uno.

**El botón ENTRAR.** Era lo único de la portada con forma de formulario.

**Y dos cosas que aparecieron verificando**, que no estaban previstas: el bloque
de texto ahora se ancla por el pie, porque con los textos de volver quedaba un
tercio del celular vacío; y `verificarCelular()` mide los dos textos de cada
lugar en vez de uno u otro según cuántas veces la corriste.

**Y después, el faro más sutil.** Nico lo miró ya arreglado y pidió dos cosas:
que no fuera tan obvio que la está iluminando a ella, ni que hay alguien
adentro del faro. Las dos se medían: el brillo sobre ella era 7,9 veces el de
alrededor, con el pico clavado en su ángulo sin moverse; y la silueta estaba
casi negra sobre el vidrio encendido, el máximo contraste de toda la pantalla.

## Verificación

| Qué | Resultado |
|---|---|
| `auditarTodo()` | 10 de 10 en verde, en el código y en el bundle |
| El faro, un solo haz | apunta a 149°, ella está a 150°, quieto en seis tiempos |
| Las catorce llegadas | todas con Bel adentro; ninguna nombra la pérdida |
| `verificarCelular()` | 28 mediciones, verde en 375x812, 390x760, 1395x920, 1532x783 |
| El hueco peor | de 250 px a 186 (23% de la pantalla, contra un límite de 30) |
| El faro, menos obvio | el pico deriva 5° durante la revelación y ya no cae en ella |
| La luz sobre ella | estable entre 20,5 y 23,3 — no se clava ni parpadea |
| La silueta | contraste de 190 a 66; sigue midiendo 34.140 px de cambio |
| El haz, difuso | 0 quiebres de pendiente en el corte, contra 210 con capas |
| El haz, amplio | 31 grados de ancho; brillo sobre ella de 7,9 a 2,8 veces el fondo |
| El desenfoque | 0,09 ms por cuadro |
| Consola | sin errores |
| `dist/el-segundo-de-mas.html` | 449,8 KB, abre solo, juega y audita en verde |

## Decisiones tomadas por criterio propio

**El pendiente de los cinco lugares se replanteó con datos.** Lo que hacía falta
no era un recuerdo sino que ella estuviera parada en la escena: la casa da cero
pronombres y es la más personal de todas ("la casa donde crecí"), mientras que
la luna, la puerta y la ruina —que yo había anotado como flojas— ya la tienen
adentro. Se tocaron tres textos, no cinco, y sin repetir la fórmula "de chica"
que ya usan la montaña rusa y la casa.

**El rojo de la calesita era del test.** Daba 182 en la primera corrida y 250 en
la segunda, y lo mismo pasaba en el bundle anterior a estos cambios: no era una
regresión. Pero adentro del test mal escrito había un problema real, así que se
arreglaron los dos — el layout y la verificación.

**El botón se arregló dos veces.** Sacarle el borde destapó que lo que dibujaba
la caja era el latido, un `box-shadow` que tiene la forma del rectángulo del
elemento. Es el mismo error que el chevron de seguir: una animación que dibuja
algo que ya no existe.

## Desvíos de la SPEC

La SPEC es la de la tanda 3 y sus criterios 1 y 4 son de aquella tanda. Se
verificaron los permanentes — 2, 3, 5 y 6 — y todos pasan. El criterio 5
nombraba `dist/el-instante.html`, que dejó de existir cuando el juego cambió de
nombre; se actualizó al nombre real y se dejó anotado el anterior.

## Bloqueado

Nada. Queda una sola cosa afuera y no depende de mí: **renombrar el repo** en
GitHub a `el-segundo-de-mas` — sigue siendo `duermevela`, que es el primero de
los tres nombres que tuvo el juego. Es un clic en la configuración del repo;
después actualizo el remoto local.
