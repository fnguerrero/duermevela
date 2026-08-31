# Prompt completo — "El segundo de más"

Este documento alcanza para reconstruir el juego entero desde cero. Está escrito
para pegarse como prompt inicial en una sesión nueva.

---

## 1. Qué hay que construir

Un juego breve, jugable en el navegador, que es **un regalo para una persona
real**: Bel, astróloga profesional, amiga de quien lo encarga. Ella juega una
sola vez, probablemente desde el celular, sin que nadie le explique nada.

Restricciones duras:

- **HTML + JavaScript + Canvas 2D. Cero dependencias.** Nada de librerías, ni
  frameworks, ni build steps.
- **Ningún archivo de imagen ni de audio.** Todo se dibuja con Canvas y todo el
  sonido se sintetiza con Web Audio API. El juego entero tiene que poder
  empaquetarse en un único `.html` que funcione con doble click.
- Tiene que andar en celular y en escritorio, en vertical y en apaisado.

---

## 2. La idea central

Bel se durmió. Lo que sigue pasa dentro de su sueño, **pero el juego no lo dice
al principio**: se revela al final, cuando el último lugar resulta ser su propia
cama con ella adentro, durmiendo.

La mecánica nace de que ella lee el tarot: **jugar un arcano transforma lo que
tenés delante, y esa cosa nueva es donde estás ahora**. La montaña rusa se
desarma en el aire y se rearma como un platillo volador; ahora estás en el
platillo. El recorrido lo arma quien juega, eligiendo cartas.

Y hay una segunda capa: **cada lugar esconde algo que no cierra**. Mientras las
piezas vuelan de una figura a la otra, hay una ventana breve para mirar. Si
tocás en el momento justo, ves lo que ese lugar escondía. Si no, se pierde para
siempre. Cuántas encuentres decide cuál de los cuatro finales te toca.

**Todo el texto va en primera persona.** No es un narrador contando lo que le
pasa a Bel: es Bel contándolo mientras pasa. En cuanto una sola línea se escapa
a la tercera persona, se nota y rompe el resto.

---

## 3. El bucle de juego

Una partida son **8 pasos**. Cada paso:

1. **Llegada.** Aparece el nombre del lugar arriba y un texto en primera persona
   describiéndolo. Si ya pasaste por ahí, el texto es otro (`vuelta` en vez de
   `llegada`), porque en un sueño repetir es verosímil.
2. **El relato espera.** No avanza solo. Se queda hasta que la persona toca la
   pantalla o aprieta una tecla. Aparece un "seguir" discreto a los ~900 ms.
3. **La mano.** Se reparten 3 cartas del mazo. El mazo se gasta: 14 cartas para
   8 pasos, así que elegir tiene costo.
4. **La transformación.** Al jugar una carta, la figura actual se desarma en
   piezas que vuelan y se rearman como la figura destino de esa carta.
5. **El instante.** Durante el vuelo se abre un anillo que se cierra hacia una
   marca. Tocar cuando el anillo llega a la marca revela lo que el lugar
   escondía. Es la única parte del juego contrarreloj.
6. **El texto de la acción** (o de lo que viste, si acertaste), que también
   espera.
7. Vuelta al 1 con el lugar nuevo.

Al octavo paso, el destino es siempre **la cama**: el despertar.

---

## 4. Las catorce cartas

Arcanos mayores reales, con su significado tradicional y su correspondencia
astrológica. Esto importa: el mazo tiene que resistir la mirada de alguien que
sabe de tarot. Nada de significados inventados para que encajen con la mecánica.

Cada carta lleva impreso su numeral romano, su nombre, su lectura y **el glifo
del astro arriba a la derecha** — ese glifo es el puente entre el tarot y la
astrología, y es lo que hace que el mazo le hable a una astróloga.

| Arcano | Nº | Astro | Lectura | Transforma en |
|---|---|---|---|---|
| La Sacerdotisa | II | ☽ Luna | Lo que sabés sin saber cómo. | *(no transforma: revela)* |
| La Emperatriz | III | ♀ Venus | Lo que cuidaste, crece. | árbol |
| Los Enamorados | VI | ♊ Géminis | Elegir deja cosas afuera. | puerta |
| El Ermitaño | IX | ♍ Virgo | Buscar solo, con la propia luz. | faro |
| La Rueda | X | ♃ Júpiter | Lo que sube, baja, y vuelve a subir. | calesita |
| El Colgado | XII | ♆ Neptuno | Quedarse quieto y mirar al revés. | reloj |
| La Muerte | XIII | ♏ Escorpio | Termina algo y arranca otra cosa. | árbol |
| La Templanza | XIV | ♐ Sagitario | Pasar de un lado al otro, sin apuro. | barca |
| La Torre | XVI | ♂ Marte | Lo mal armado se cae. | ruina |
| La Estrella | XVII | ♒ Acuario | Después del derrumbe, el agua limpia. | laguna |
| La Luna | XVIII | ♓ Piscis | Nada es lo que parece. | luna |
| El Sol | XIX | ☉ Sol | Todo queda a la vista. | casa |
| El Mundo | XXI | ♄ Saturno | La vuelta entera, por fin completa. | calesita |
| El Loco | 0 | ♅ Urano | Salir sin saber a dónde. | bandada |

**La Sacerdotisa es especial**: no transforma el lugar, revela lo que esconde
sin necesidad de acertar el instante. Es el arcano del conocimiento oculto, así
que es la única que puede hacer eso.

Cada carta tiene además un texto de acción en primera persona, que es lo que se
lee mientras la transformación ocurre: *"Se vino abajo sin que lo tocara."*,
*"Se me abrió una salida donde no había pared."*, *"Se soltó en pedazos y los
pedazos se me fueron volando."*

---

## 5. Los catorce lugares

Cada lugar tiene cuatro cosas: **nombre**, texto de **llegada**, texto de
**vuelta** (si ya estuviste), y lo que **esconde** — la anomalía que solo se ve
si acertás el instante.

Las anomalías son lo mejor del juego. Todas siguen la misma lógica: son cosas
que en un sueño pasan desapercibidas y despierto serían imposibles.

- **La montaña rusa** *(arranque)* — las vías se cortan en el aire, "como si
  nadie se hubiera tomado el trabajo de imaginarles un final".
- **El platillo** — adentro no hay nadie y sin embargo espera que le prestes
  atención. "Acá todo espera eso."
- **La calesita** — la música no sale de la calesita: llega de todos lados a la
  vez, igual de fuerte lejos que cerca.
- **El agua** — el reflejo devuelve la orilla y la luz, pero no a ella.
- **El faro** — el haz da la vuelta entera y siempre frena un segundo de más al
  pasarle por encima. No alumbra el campo: la alumbra a ella.
- **La casa** *(donde creció)* — las ventanas están prendidas pero adentro no
  hay lámparas: está iluminada de la manera en que uno se acuerda de las casas.
- **El árbol** — no tiene sombra, y ahí se da cuenta de que la suya tampoco.
- **El reloj** — puede ver los números perfectamente pero no significan nada,
  como una palabra mirada demasiado rato.
- **La luna** — los cráteres se mueven y se acomodan como una cara que está por
  decir algo.
- **La puerta** *(parada sola, sin pared)* — la cierra, la abre otra vez y ahora
  hay una habitación. Cambió porque ella esperaba que cambiara.
- **Lo que quedó** *(escombros)* — abajo de los pedazos hay más pedazos. Esto no
  se cayó: lo armaron ya roto.
- **Los pájaros** — ninguno bate las alas sincronizado, salvo cuando los mira.
- **La barca** *(sin agua abajo)* — está atada y la soga se pierde en el aire,
  hasta que simplemente deja de existir.
- **La cama** — *"Estoy yo adentro, durmiendo."* Es la revelación y solo puede
  aparecer en el último paso.

**Regla dura: la cama está prohibida hasta el paso 8.** Si aparece antes, se
arruina el final. Tiene que haber una red de seguridad en el código y una
verificación automática que lo compruebe.

---

## 6. La mecánica del instante

Un anillo que se cierra hacia una marca circular. Números concretos:

- Ventana de acierto exacto: **0,070** de la duración.
- Ventana de acierto válido: **0,160**.
- Después de **3 fallos seguidos**, la ventana se agranda 0,045 (hasta un máximo
  de 0,12 acumulado) y el juego lo dice: *"te doy un poco más de tiempo"*. Que se
  note que es a propósito y no que de golpe se volvió fácil.
- El anillo pasa de largo la marca: esperar no cuenta como acierto.

Cuando fallás, el juego dice **qué** perdiste, no solo que perdiste: *"se te pasó
— este lugar escondía algo y ya no vas a saber qué"*. Decir "eso ya no lo vas a
ver" es peor: se refiere a algo que la persona nunca vio, así que no significa
nada.

---

## 7. Los cuatro finales

Al terminar, se da vuelta **un arcano XXII** — que no existe en el tarot real, y
esa es la gracia: es la carta que es de ella. Cuál toca depende de cuántas
anomalías encontró. Es la misma figura en cuatro grados, de dormida a despierta,
con las estrellas pasando de apagadas a estar en su mano.

| Encontró | Arcano | Lectura |
|---|---|---|
| 0 | La Durmiente | Pasar al lado y seguir de largo. |
| 1–2 | La Que Se Despierta | Con una alcanza para saber que se puede. |
| 3–5 | La Testigo | Quedarse el segundo de más. |
| 6–8 | La Astróloga | Mirar hasta que la cosa se rinde. |

Los cuatro textos le hablan **a ella directamente**, y es lo único del juego que
sale del sueño. Toman la mecánica —mirar en el momento justo— y la convierten en
algo sobre cómo mira las cosas en la vida real:

> las viste porque te quedaste el segundo de más que la mayoría no se queda (…)
> Es lo que hacés cuando alguien te cuenta algo y vos ves lo que no dijo.

Los cuatro cierran con *"Seguí. Hay gente esperando que le mires las cosas."*,
menos el de cero, que invita a volver a jugar.

**Después del arcano, siempre**, pase lo que pase: un sobre que se abre y una
**carta manuscrita de verdad**, en papel rayado con tipografía de puño y letra,
de quien le regala el juego para ella. Esa carta no depende del resultado.

---

## 8. Estética

**Las cartas: tarot de Marsella.** Fondo crema, filete doble impreso, numeral
romano arriba, cartela con el nombre abajo, cinco tintas planas (rojo, azul,
oro, carne, verde) y tinta negra para los contornos. Dos detalles que hacen la
diferencia entre "parece tarot" y "parece tarot de verdad":

- **Registro imperfecto**: un fantasma de la lámina corrido un pelo, debajo de
  la buena, como una impresión vieja mal alineada.
- **Desgaste del filete**: mordiscos del color del papel sobre el borde. Un
  borde perfecto delata que lo dibujó una máquina.

Las texturas de papel usan un generador pseudoaleatorio **con semilla estable
por carta**, para que la misma lámina se vea siempre igual y no "hierva" al
repintarse.

**La escena: noche, azules y violetas profundos.** Bel es una figura pequeña de
pie a un costado, mirando. Las figuras se dibujan con dos representaciones
distintas del mismo objeto:

- una de **segmentos** (para el vuelo de las piezas durante la transformación),
- una de **ilustración completa** (para el estado de reposo).

Eso es lo que permite que una montaña rusa se desarme y se rearme como platillo
volador sin que ninguna de las dos parezca un montón de palitos.

Hay un reflejo tenue y desenfocado de la figura sobre el piso, que es lo que
hace que el suelo deje de ser una franja negra y pase a ser un lugar.

---

## 9. Audio

Todo sintetizado: osciladores, ruido filtrado y una reverb por convolución con
un impulso generado en código. Hace falta un límite de voces simultáneas con
liberación por `onended`, o el navegador se satura.

- **Catorce colores sonoros**, uno por lugar.
- Tic del anillo, acierto, fallo, volteo de carta, roce al pasar por una carta.
- **La tensión crece con lo descubierto**: cuantas más anomalías encontrás, más
  se acelera y se densifica el fondo, y a partir de la mitad entra una cuarta
  voz. No es un efecto encima: es la misma animación acelerada, y por eso se lee
  como que el lugar se puso nervioso y no como un filtro.

---

## 10. Arquitectura

Un módulo por responsabilidad, todos con el patrón IIFE:

| Archivo | Qué hace |
|---|---|
| `guion.js` | Todo el contenido: cartas, lugares, finales, la carta manuscrita |
| `juego.js` | El hilo del juego: pasos, mano, transformación, estado |
| `naipes.js` | Dibuja los naipes al modo Marsella |
| `arcanos.js` | Las láminas de cada arcano |
| `figuras.js` | Las figuras como segmentos, para el vuelo |
| `pintores.js` | Las figuras como ilustración, para el reposo |
| `instante.js` | La mecánica del anillo |
| `bel.js` | El personaje |
| `cielo.js`, `luna.js`, `dibujo.js` | Fondo y utilidades de dibujo |
| `audio.js` | Todo el sonido |

Más un `build.py` que empaqueta todo en un `.html` suelto, y un servidor de
desarrollo mínimo.

---

## 11. Reglas duras (aprendidas a los golpes)

Estas no son preferencias: cada una salió de un bug real.

1. **El estado del juego no puede depender de que se esté dibujando.** Con la
   pestaña en segundo plano el navegador deja de dar cuadros; si la
   transformación avanza solo dentro del frame, el juego se congela a mitad de
   camino y no termina nunca. Hace falta un respaldo por reloj.

2. **Un gesto hace una sola cosa.** Si el mismo toque sirve para el anillo y para
   avanzar el texto, tocar el anillo tarde también se lleva puesto el texto que
   acaba de aparecer.

3. **Los botones nacen deshabilitados.** Los del final aparecen uno atrás del
   otro y todos centrados, justo donde la persona viene tocando para pasar
   textos. Sin una demora de 1,4–2,6 s, un toque que sobra dispara el botón
   siguiente y se salta pantallas enteras sin leerlas.

4. **El cartel dice lo que se está viendo, no en qué paso va la partida.** La
   figura cambia apenas termina la transformación; si el nombre se actualiza en
   otro momento, la pantalla muestra un lugar con el nombre de otro.

5. **Nunca medir un elemento vacío para deducir geometría.** Una mano sin cartas
   igual mide alto, porque el alto se lo da el CSS. Preguntar solo por la altura
   da por buena una mano que no existe.

6. **El texto nunca corre contra reloj.** A 15 caracteres por segundo —la
   velocidad máxima de alguien concentrado y sin nada más pasando— la primera
   partida es una carrera, porque estás aprendiendo a jugar al mismo tiempo que
   leés. Solo el instante se cronometra.

7. **La geometría sale de dónde están las cosas, no de porcentajes fijos.** El
   piso se calcula midiendo dónde está la mano, no con un `H * 0.84`.

---

## 12. Verificaciones que tiene que haber

El juego se prueba solo. Estas comprobaciones existen y son parte del entregable:

- `verificarBases()` — que cada figura apoye donde corresponde.
- `verificarDibujo()` — que las 14 figuras se dibujen sin tirar error.
- `auditar()` — que no falte ningún lugar, carta, figura ni pintor, y que
  ninguna combinación lleve a la cama antes de tiempo.
- `verificarRotulo()` — corre una partida entera y vigila que el cartel diga
  siempre lo que se está dibujando.
- `pruebaPartida()` / `simularMuchas(n)` — partidas completas automáticas, con
  variedad de recorridos.

La última es la más importante y la menos obvia: **ninguna otra prueba caza un
desajuste de rótulo**, porque el juego funciona, no tira errores y las figuras
están bien dibujadas. Simplemente se lee un nombre que no corresponde.

---

## 13. Tono

Argentino, hablado, sin solemnidad. Frases cortas. Nada de lenguaje de fantasía
ni de misticismo decorativo — el juego es sobre mirar con atención, no sobre
magia. La única vez que se pone sincero es al final, y ahí se permite decirle
algo verdadero a la persona que lo está jugando.
