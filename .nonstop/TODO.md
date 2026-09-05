# TODO — tanda 7: lo que esconden dos lugares, y lo que salió al jugarlo

Dos ideas de Nico sobre las anomalías. No son arreglos: es contenido nuevo.
El TODO de la tanda 6 queda archivado en tanda6/.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado

## A · El faro

- [x] A1 · Alguien arriba, adentro de la linterna: una silueta de mujer, lejos, quieta, mirando para abajo. Sin saludo — una silueta que saluda es alguien que la conoce · verif: se lee entera en el juego real y en 375x812, y no tiene cara
- [x] A2 · Bel sonríe apenas, y en el faro — y solo ahí — no cierra los ojos · verif: medido cuánto cambia la sonrisa en pantalla, y dicho en el código

## B · La calesita

- [x] B1 · Se despega un dedo del piso y sigue girando, con las luces del borde dando toda la vuelta para el mismo lado. NO se convierte en platillo: transformar es lo que hacen las cartas · verif: la anomalía sube de 1.696 a 10.749 píxeles
- [x] B2 · La frase de la música se muda al texto de llegada, y el indicio del cierre pasa a ser "La calesita que no tocaba el piso" · verif: verificarTextos() en verde

## D · Lo que salió mirándolo jugar

- [x] D1 · La nave no aparece en los dos primeros lugares: al principio todo tiene que poder pasar por raro pero terrestre · verif: 300 sorteos, 0 naves en los pasos 0 y 1, 23% después
- [x] D2 · Se va el cartel de "LO VISTE". De lo que apareció sale una luz que viaja hasta el marcador, y recién al llegar se enciende la bolita y late el contador · verif: al acertar el aviso queda vacío y el marcador toma la clase `suma`
- [x] D3 · La guía sale de la caja y se va al pie, en versalitas y sin borde. Con cartas repartidas se queda arriba de ellas · verif: medida su caja abajo y con cartas
- [x] D4 · El icono de seguir era un sobre — y el sobre es el objeto del final. Pasa a ser un chevron de contorno · verif: transform en matrix(.707,.707,-.707,.707), o sea rotado de verdad
- [x] D5 · Y un solo cartel al seguir de largo, igual que al acertar: la primera vez dice también cómo se hace, la segunda solo que había algo, después se calla · verif: una partida sin mirar muestra un único aviso
- [x] D6 · Dos `@keyframes latir` distintos en la misma hoja, y el del marcador le borraba la rotación al chevron · verif: cada animación con su nombre

## C · Cierre

- [x] C1 · `auditarTodo()` en verde · verif: todos los sub-resultados ok
- [x] C2 · Reempaquetar `dist/` · verif: el `.html` suelto abre y juega

## Los laboratorios

`test/faro.html` y `test/calesita.html` quedan puestos: muestran el ciclo de
mirada del juego y guardan láminas. El de la calesita conserva las tres
variantes que se compararon — la de hoy, la que se despega y la del platillo —
para que se vea por qué se eligió la del medio.
