# TODO — tanda 8: lo que quedó abierto

Lo que Nico dejó señalado y no se resolvió, más los dos cabos sueltos que
anoté yo. El TODO de la tanda 7 queda archivado en tanda7/.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## A · El faro: una sola luz

Nico: "son como dos haz de luz diferente, uno el que le da a Bel todo el
tiempo y otro el que gira constantemente". Y son dos de verdad: el pintor
barre su haz y la anomalía dibuja un cono aparte encima. Mismo error de
familia que las vías y el platillo — el efecto tiene que hacerlo la figura.

- [x] A1 · El haz del pintor frena y se inclina hasta ella, en vez de que la anomalía dibuje un segundo cono · verif: contar cuántos conos claros salen de la linterna en el cuadro revelado — tiene que ser uno
- [x] A2 · La anomalía se queda solo con lo que no es luz: el charco en el piso y la silueta · verif: verificarAnomalias() y verificarUbicacion() siguen en verde para el faro

## B · Los cinco lugares sin recuerdo

Cinco de los catorce lugares no dicen de qué recuerdo salen: el agua, la
luna, la puerta, la ruina y los pájaros. En los otros nueve el texto de
llegada ancla el lugar a algo de ella. Ahí el juego se vuelve genérico.

- [x] B1 · Relevar cuáles son y qué dice hoy cada uno · verif: listado con el texto actual de los cinco
- [x] B2 · Escribir el anclaje de los cinco, sin nombrar a nadie · verif: verificarTextos() en verde y ninguno nombra la pérdida

## C · La portada

- [x] C1 · El botón ENTRAR es lo único que quedó con forma de botón de formulario · verif: sin borde de caja, y sigue siendo pulsable con el dedo en 375x812

## E · Lo que salió verificando (no estaba previsto)

- [x] E1 · El bloque de texto se ancla por el pie: con el texto de volver, que es la mitad de corto, quedaba un tercio de pantalla vacío y el chevron flotando · verif: llegada y vuelta dan el mismo hueco en los 14 lugares
- [x] E2 · `verificarCelular()` medía un texto u otro según cuántas veces la habías corrido, así que encontraba el caso malo por azar. Mide los dos · verif: 28 mediciones en vez de 14

## F · El faro, más sutil (pedido de Nico)

- [x] F1 · Que no sea tan obvio que la está iluminando a ella · verif: medir cuánto del brillo cae sobre ella contra cuánto cae alrededor
- [x] F2 · Que no sea tan obvio que hay alguien adentro del faro · verif: medir el contraste de la silueta contra la linterna

## G · El faro difuso (segunda vuelta de Nico)

- [x] G1 · El haz más amplio, no más angosto: cerrarlo fue el error de la vuelta anterior · verif: 31 grados de ancho angular
- [x] G2 · Difuso de verdad, sin las bandas de las capas · verif: 0 quiebres de pendiente en el corte transversal, contra 210
- [x] G3 · Adentro de la linterna no está todo encendido: lámpara y penumbra, no un bloque blanco · verif: el faro sin revelar sigue leyéndose prendido

## H · Jugandolo (reportes de Nico en vivo)

- [x] H1 · "cuando yo tenía nueve" → "cuando yo era chica" · verif: sin repetir "chica" dos veces en la misma frase
- [x] H2 · El recuadro oscuro alrededor del título, que tapaba la luz de la luna · verif: el halo ya no se corta contra ningún borde
- [x] H3 · El pájaro del árbol, más chico · verif: de .094E a .070E, y la anomalía sigue midiendo 6.621 px
- [x] H4 · "este escenario todavía lo sigo sin entender": las vías · verif: la punta pasa de 0,47E a 0,85E sobre el piso
- [x] H5 · El bug que dejaba los soportes enteros: un `var q` pisaba el factor de corte · verif: las columnas se cortan con la vía
- [x] H6 · "qué es esa silueta oscura?": la laguna, rehecha sin dibujar la ausencia · verif: de 3% a 100% pegada al agua
- [x] H7 · La barca se sacude de verdad · verif: de 2,5 grados con un seno a 7 con tres frecuencias

## I · El círculo (lugar nuevo, pedido de Nico)

- [x] I1 · Un lugar que entra hermoso, se pone denso y se pasa · verif: el arco sube y baja dentro de la misma revelación
- [x] I2 · Lo que esconde: que se pasa, y que se estaba pasando incluso mientras creía que no · verif: verificarTextos() en verde
- [x] I3 · El único lugar donde NO mirar tiene su propia respuesta · verif: partida real, salió "menos mal" donde los otros dicen "acá había algo"
- [x] I4 · Entra entero: carta (El Diablo, XV), figura, base, lejanía, tramo y etiqueta · verif: 15 lugares, 15 cartas, 15 figuras
- [x] I5 · Las seis verificaciones que recorren lugares tenían la lista escrita a mano y no lo miraban · verif: derivadas de Guion.LUGARES, 15 medidos

## J · Abierto

- [x] J1 · El paso podía avanzar dos veces: el guardián y el cierre normal lo hacían por caminos separados, cada uno con su propia guarda · verif: 8 recorridos seguidos de largo 9, donde antes 1 de cada 6 salía de 10

## K · Las vías, cuarta vuelta: el símbolo

- [x] K1 · El texto hablaba del decorado y no de ella. Ahora simboliza los altibajos a los que nadie les imaginó un final · verif: verificarTextos() en verde
- [x] K2 · El dibujo se leía como un plano técnico: columnas con peso, menos cruces y la vía dominando · verif: se lee como montaña rusa en 375x812
- [x] K3 · La etiqueta del cierre, acorde al símbolo nuevo · verif: "El recorrido al que nadie le imaginó un final"

## L · Auditoría de significado (los 15 lugares)

- [x] L1 · Relevar qué simboliza cada lugar para ella, con el criterio que salió de la montaña rusa · verif: tabla de 15; tres hablaban del decorado y una era redundante
- [x] L2 · La calesita: gira sin apoyarse y no deja marca — seguir andando por inercia · verif: verificarTextos() en verde
- [x] L3 · La puerta: abrirla sabiendo que del otro lado no está lo que busca · verif: ídem
- [x] L4 · Los pájaros: lo único que todavía le hace caso · verif: ídem
- [ ] L5 · PENDIENTE: la luna y el platillo dicen lo mismo (alguien que quiere hablarle y no puede). Uno de los dos tendría que decir otra cosa; la luna es de ella por oficio y ahí hay algo sin usar

## M · El círculo, como pasó de verdad

- [x] M1 · No baja solo: la certeza de que no se termina más es el centro, no un rodeo antes del alivio · verif: la curva sube, se queda arriba y solo afloja al final
- [x] M2 · Un árbol aparece en el centro y la respiración con él es lo que la saca · verif: entra a partir del 60% de la revelación y es lo único cálido de la escena
- [x] M3 · Más oscuro y sombrío: la luz de alrededor se apaga y queda solo lo que mira · verif: se ve el túnel alrededor del círculo
- [x] M4 · Latidos del corazón que aceleran y se calman · verif: Audio2.corazon(), de 62 a 138 pulsaciones, con reloj propio
- [x] M5 · El árbol imponente, de abrazar: de .86E a 1.42E y el tronco como forma rellena con raíces · verif: se lee como árbol de abrazar en la lámina
- [x] M6 · De quince hongos a tres; el círculo lo hace la marca del pasto · verif: la figura de trazos también, o la transformación mostraría doce que no están
- [x] M7 · Iluminación psicodélica: el color no se queda quieto · verif: ocho anillos y cinco bandas con los tonos girando, desenfocadas
- [x] M8 · El árbol está siempre: sin revelar el lugar eran tres hongos y una mancha · verif: la figura de trazos también lo tiene, o aparecería de la nada
- [x] M9 · Los hongos al pie del árbol, sin anillo · verif: el anillo con tres puntos no era un anillo
- [x] M10 · Que parezca que está drogada: las cosas mismas cambian de color, con saturation, color y overlay · verif: en dos instantes el árbol sale lima y cian; sin revelar se ve normal

## N · Bel hace lo que el texto dice

- [x] N1 · Cuatro gestos, cada uno sacado de la frase que ese lugar ya tenía escrita · verif: asoma, alza, abraza y abre, con lámina de cada uno
- [x] N2 · Se acerca a la figura con cada indicio · verif: hasta un 13% del ancho al final del recorrido
- [x] N3 · En abrazar llega hasta el tronco, que es la única excepción al tope que la mantiene fuera de la figura · verif: la lámina la muestra tocándolo
- [x] N4 · Los gestos y la caminata entran completos en modo captura, donde dt es 0 · verif: las cuatro láminas los muestran hechos
- [x] N5 · Camina más despacio cuando la mueve un gesto, y con curva suave · verif: de .13 a .052 del ancho por segundo
- [x] N6 · La luna gira la cara hacia ella, que es lo que el texto ya decía · verif: rasgos corridos y juntados, con el ojo de su lado más grande

## O · La barca con agua (pedido de Nico)

- [x] O1 · Agua, olas, lluvia, relámpagos y truenos · verif: verificarDibujo y las dos de anomalías en verde
- [x] O2 · El sentido se corre en vez de perderse: la tormenta es real y lo que no llega es hasta ella · verif: verificarTextos() en verde
- [x] O3 · `Audio2.trueno()`, con el filtro bajando y separación despareja · verif: existe y suena distinto cada vez
- [x] O4 · El reloj corta en el deseo y no en la conclusión · verif: verificarTextos() y auditarTodo() en verde
- [x] O5 · Lo que quedó pierde la culpa y conserva el desconcierto · verif: auditarTodo() en verde
- [x] O6 · Más olas, relámpagos, truenos y meceo · verif: olas rellenas con cresta, y el dibujo sigue limpio

## P · Lo que salió mirándolo de nuevo

- [x] P1 · Las ventanas de la anomalía de la casa estaban en ±.17E y las reales en -.46E y +.30E · verif: 100% pegada, y ahora se ve el marco encendido con el vidrio apagado
- [x] P2 · Las naves: del 22% al 9% de los eventos, la mitad de tamaño y desenfocadas · verif: de .017 a .0095 del lado corto
- [x] P4 · La raya de luz de la persiana, dibujada en el cierre · verif: aparece a los 5,5 s, cuando el texto la nombra
- [x] P3 · Las frases de carta se dicen durante la transformación, con el sujeto todavía en pantalla · verif: partida entera con 8 pasos y 0 errores
- [x] P5 · El sobre dejaba ver la escena de atrás entre que se iba y llegaba la carta · verif: el peor momento del cruce deja 2% de fondo

## Q · Las personas y el sonido

- [x] Q1 · Las tres reglas de la portada se contradecían sobre quién está adentro del sueño · verif: ahora las tres dicen que ella vive y vos mirás
- [x] Q2 · Prender el sonido guardaba la preferencia de silencio · verif: prender guarda 0, apagar 1, prender otra vez 0

## D · Cierre

- [x] D1 · `auditarTodo()` en verde · verif: 10 de 10, con `tramos` incluido
- [x] D2 · Reempaquetar `dist/` · verif: el `.html` suelto abre y juega
