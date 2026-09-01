# El segundo de más — resumen completo

Documento para que alguien de afuera entienda el juego entero y pueda opinar.
Está todo acá: para quién es, cómo funciona, qué dice, y las decisiones que se
tomaron y por qué. No hace falta ver el código ni jugarlo.

---

## 1. Qué es y para quién

Un juego breve para navegador, hecho como **regalo para una sola persona**: Bel,
astróloga profesional, amiga de quien lo hizo. Ella lo va a jugar una vez,
probablemente desde el celular, sin que nadie le explique nada.

El contexto importa para opinar: **Bel perdió a su madre hace pocos meses**. El
juego no lo nombra nunca, pero varias cosas lo tocan de costado, y ahí está la
mayor parte del riesgo.

Restricciones técnicas: HTML + JavaScript + Canvas, sin dependencias, sin
archivos de imagen ni de audio — todo se dibuja y se sintetiza en código, y
funciona como un único `.html` con doble click.

---

## 2. La idea

Bel se durmió. Lo que sigue pasa dentro de su sueño, **pero el juego no lo dice
al principio**: se revela al final, cuando el último lugar resulta ser su propia
cama con ella adentro, durmiendo.

La mecánica sale de que ella lee el tarot: **jugar un arcano transforma lo que
tenés delante, y esa cosa nueva es donde estás ahora**. La montaña rusa se
desarma en el aire y se rearma como un platillo volador; ahora estás en el
platillo.

Y hay una segunda capa. **Cada lugar esconde algo que no debería estar pasando.**
Mientras las piezas vuelan hay una ventana breve para mirar; si tocás en el
momento justo, el lugar se congela, vuelve a armarse y te muestra lo que
escondía. Si no, se pierde para siempre. Cuántas veas decide cuál de los cuatro
finales te toca.

**Todo el texto está en primera persona.** No es un narrador contando lo que le
pasa a Bel: es Bel contándolo mientras pasa.

---

## 3. Cómo se juega

Una partida son **8 pasos**. Cada paso:

1. Llegás a un lugar. Aparece su nombre y un texto en primera persona.
2. **El texto espera**: no avanza solo, se queda hasta que tocás. Aparece un
   "seguir" discreto a los 900 ms.
3. Se reparten **3 cartas** de un mazo de 14. El mazo se gasta.
4. Al jugar una, la figura se desarma en piezas que vuelan y se rearman como la
   figura de esa carta.
5. Durante el vuelo se abre un anillo que se cierra hacia una marca. **Tocar
   cuando llega** revela lo escondido. Ventana de acierto: 0,16 de la duración;
   0,07 para el acierto exacto. A los 3 fallos seguidos la ventana se agranda y
   el juego lo dice.
6. Si acertaste, **el mundo se frena**: la figura vuelve a armarse entera y ahí
   leés lo que ese lugar escondía, con la figura vieja todavía delante.
7. Vuelta al 1 con el lugar nuevo.

El octavo paso lleva siempre a la cama: el despertar.

---

## 4. La estructura del sueño

El recorrido no es libre del todo. Tiene tres tramos:

| Tramo | Pasos | Se elige | Lugares |
|---|---|---|---|
| **Lo que fue** | 1–3 | sí, libre | el árbol, la calesita, el agua, la luna |
| **Lo que pasó** | 4–5 | **no** | la barca y lo que quedó, en ese orden |
| **Lo que queda** | 6–7 | sí, con menos mazo | el faro, la nave, la casa, el reloj, la puerta |

En el tramo del medio **la mano viene con una sola carta**. El jugador estira la
mano para elegir y descubre que no hay nada que elegir. Eso no lleva ningún
texto que lo explique.

---

## 5. Los catorce lugares y lo que esconden

Cada lugar tiene un texto de llegada, uno distinto si volvés, y **la anomalía**
que solo se ve si acertás el instante.

| Lugar | Lo que esconde |
|---|---|
| La montaña rusa *(arranque)* | las vías se cortan en el aire, "como si nadie se hubiera tomado el trabajo de imaginarles un final" |
| La nave | no vino a llevarla: vino a decirle algo y no sabe cómo |
| La calesita | la música no sale de ahí, llega de todos lados y se escucha con los oídos tapados |
| El agua | el reflejo devuelve todo menos a ella |
| El faro | frena un segundo de más cada vez que la encuentra, y sigue tranquilo |
| La casa *(donde creció)* | está iluminada "de la manera en que uno se acuerda de las casas" |
| El árbol | se posa un pájaro de un color que no existe, se queda apenas y no vuelve |
| El reloj | ve los números perfectamente pero no significan nada |
| La luna | los cráteres se acomodan como una cara que está por decir algo |
| La puerta | la cierra, la abre y ahora hay una habitación: cambió porque ella lo esperaba |
| Lo que quedó | abajo de los escombros hay más escombros: lo armaron ya roto |
| Los pájaros | se sincronizan solo cuando ella los mira |
| La barca | la sacude todo y no se va a ningún lado |
| **La cama** | *"Estoy yo adentro, durmiendo."* |

---

## 6. Las referencias personales

Ninguna se nombra. Están para que ella las encuentre si quiere, y si no, sigue
siendo un sueño raro y lindo.

- **El faro** es la madre. No se dice en ninguna parte: se dice que el haz la
  busca a ella y que sigue de largo más tranquilo cuando la encuentra.
- **El árbol** es una tarde en Tigre, mirando la estructura fractal de un árbol
  desde el pasto. El pájaro de color imposible pasó de verdad.
- **La casa** es la casa a la que pudo volver.
- **La nave**: ella ve naves seguido y las considera guías. Además de ser un
  lugar, **cruza el cielo de fondo** cada tanto durante toda la partida.
- **El reloj** lleva casi textual una frase de un cuento de Sacheri: *la culpa de
  todo la tiene el tiempo, que se empeña en transcurrir*.
- **La barca** es la tormenta que atravesó.

---

## 7. El mazo

Arcanos mayores reales, con su significado tradicional y su correspondencia
astrológica. Cada carta lleva impreso el glifo de su astro.

| Arcano | Astro | Transforma en |
|---|---|---|
| 0 El Loco | Urano | la nave |
| II La Sacerdotisa | Luna | *(no transforma: revela)* |
| III La Emperatriz | Venus | el árbol |
| VI Los Enamorados | Géminis | la puerta |
| IX El Ermitaño | Virgo | el faro |
| X La Rueda | Júpiter | la calesita |
| XII El Colgado | Neptuno | el reloj |
| XIII La Muerte | Escorpio | el árbol |
| XIV La Templanza | Sagitario | la barca |
| XVI La Torre | Marte | lo que quedó |
| XVII La Estrella | Acuario | el agua |
| XVIII La Luna | Piscis | la luna |
| XIX El Sol | Sol | la casa |
| XXI El Mundo | Saturno | la calesita |

Los naipes se dibujan al modo **tarot de Marsella**: fondo crema, filete doble,
numeral romano, cartela con el nombre, cinco tintas planas, y dos detalles que
los hacen creíbles — el registro corrido (un fantasma de la lámina desalineado,
como una impresión vieja) y el desgaste del filete.

---

## 8. La luna, que es el hilo

Está siempre en el cielo y **su fase es lo que llevás visto**: de nueva con cero
a llena con ocho. Al final, la carta que te toca y la luna que hay en el cielo
dicen lo mismo — así que la carta no revela nada que no estuviera arriba toda la
partida.

El **signo** en que está la luna sí es el real de esa noche, calculado con
efemérides. Nadie que no sepa de esto lo mira dos veces.

---

## 9. El final

Se da vuelta un **arcano XXII**, que no existe en el tarot real: esa es la gracia,
es la carta que es de ella. Cuál toca depende de cuántas anomalías vio.

| Vio | Arcano | Lectura |
|---|---|---|
| 0 | La Durmiente | Pasar al lado y seguir de largo. |
| 1–2 | La Que Se Despierta | Con una alcanza para saber que se puede. |
| 3–5 | La Testigo | Quedarse el segundo de más. |
| 6–8 | La Astróloga | Mirar hasta que la cosa se rinde. |

Los cuatro le hablan **directamente a ella**, y es lo único que sale del sueño.
Toman la mecánica —mirar en el momento justo— y la convierten en algo sobre cómo
mira las cosas en la vida real:

> las viste porque te quedaste el segundo de más que la mayoría no se queda (…)
> Es lo que hacés cuando alguien te cuenta algo y vos ves lo que no dijo.

Los cuatro cierran con *"Seguí. Hay gente esperando que le mires las cosas."*,
menos el de cero, que invita a volver a jugar.

**Después del arcano, siempre**, pase lo que pase: un sobre que se abre y una
carta manuscrita de verdad, escrita por él, en papel rayado con letra de puño.
Esa carta no depende del resultado y es la única parte donde se habla claro.

---

## 10. Decisiones que se tomaron, y por qué

- **La palabra "murió" está fuera del juego.** El arcano se sigue llamando La
  Muerte, porque en el tarot no significa morir y ella lo sabe; falsear el mazo
  sería peor. Pero el texto que se lee al jugarla no la usa.
- **Ninguna referencia es explícita.** Si están subrayadas, ella no tiene
  escapatoria; así puede jugarlo entero sin ver ninguna.
- **El texto nunca corre contra reloj.** Antes iba a 15 caracteres por segundo,
  que es la velocidad máxima de alguien concentrado sin nada más pasando — y acá
  además hay una animación y una mecánica que aprender. Solo el instante se
  cronometra.
- **En el tramo del medio no se puede elegir**, y no hay ningún texto que lo
  diga.
- **Ninguna carta te devuelve al lugar que acabás de dejar.** Volver a un lugar
  ya visitado sí puede pasar y tiene texto propio; rebotar contra el anterior se
  leía como un error del juego.

---

## 11. Sobre qué se podría opinar

Algunas cosas que a quien lo hizo le importan y no puede juzgar solo:

1. **El tono del final.** Los cuatro arcanos le dicen a Bel que mira distinto que
   el resto. ¿Es un lindo cierre o se pasa de atrevido?
2. **El peso de las referencias.** El faro es la madre. ¿Está bien dosificado o
   puede golpear en un mal momento?
3. **La estructura de tres tramos.** ¿Se entiende jugando que en el del medio no
   se puede elegir, o solo se siente como que el juego se rompió?
4. **La dificultad del instante.** Ventana de 0,16, y se agranda a los 3 fallos.
   ¿Alcanza para alguien que no juega videojuegos?
5. **La longitud.** Ocho pasos, con textos de 400 a 600 caracteres por lugar.
6. **Si se entiende sin explicación.** Es lo que más costó: hay tres reglas en la
   portada y tres avisos que salen una sola vez durante la primera partida.
