# Informe — tanda 4

La portada, los ocho lugares que faltaban y la luna como hilo de la partida.

## Qué se hizo

**La portada.** El velo era medio transparente en el centro y la montaña rusa
subía justo hasta el título: letras claras sobre vigas claras. Ahora el centro
es casi opaco y la escena asoma solo en los bordes. Los números de las tres
reglas iban en la serif del título a 12 px con espaciado, y a ese cuerpo una
serif con remates se empasta: pasan a tipografía de sistema, 14 px, peso 600,
con fondo propio.

**Los catorce lugares.** Los ocho que quedaban cortos se reescribieron en
primera persona y más largos. De paso apareció un bug que ya estaba en los seis
de la tanda anterior (ver abajo), así que se regeneraron los catorce.

**La luna como hilo.** Está siempre en el cielo y su fase *es* lo que la
jugadora lleva encontrado, de nueva a llena. Sale de la misma cuenta que elige
el arcano XXII, así que al final la carta no le revela nada que no estuviera
arriba toda la partida. Se apaga cuando el lugar del recorrido es la luna.

## Cómo correrlo

Servidor de desarrollo: `py -3 tools/servidor.py 8156` y abrir
`http://localhost:8156`. O el archivo suelto `dist/el-segundo-de-mas.html`, con
doble click, sin servidor.

## Verificación

| Prueba | Resultado |
|---|---|
| `verificarBases()` | 14/14 |
| `verificarDibujo()` | 14 figuras, 0 fallos |
| `auditar()` | sin faltantes, sin cama temprana |
| `verificarRotulo()` | 0 desajustes |
| `verificarTramos(3)` | 0 fallos, recorridos variados |
| Textos contra el JSON de origen | 0 diferencias · 14 lugares × 5 campos |
| Fases de la luna | la luz crece siempre: 0 → 510 px aislada, 0 → 1223 en el juego |
| Fase contra arcano final | 0 desajustes en los 9 resultados posibles |
| Portada | 0,6 % de píxeles claros del fondo dentro de la caja del título |

Las cinco primeras corren en 28 segundos.

## Decisiones tomadas por criterio propio

- **La luna se ve desde el hemisferio sur**, iluminada por la izquierda. Es
  desde donde la mira ella.
- **Del cálculo real de efemérides se usa el signo, no la fase.** La fase la
  marca el juego; que el signo sí sea el verdadero es el guiño: si lo mira,
  coincide con el cielo de afuera.
- **La cama queda exenta del mínimo de largo en su `esconde`.** Son seis
  palabras — "Estoy yo adentro, durmiendo" — y ahí está toda su fuerza. Se
  alargó la `vuelta` para que el lugar cumpla el criterio sin tocar el golpe.
- **La luna del cielo se apaga en el lugar `luna`.** Dos lunas en el mismo
  cuadro se leen como un error de dibujo, no como una idea.

## Desvíos respecto de lo planeado

- **`js/luna.js` ya existía y no lo cargaba nadie.** Un módulo entero de
  efemérides, con el cálculo real de fase y signo, escrito y nunca enchufado ni
  en `index.html`. El plan era escribir el cálculo; en realidad solo hubo que
  conectarlo.
- **Se regeneraron los catorce lugares, no los ocho previstos.** Al escribir los
  ocho apareció que la función que parte el texto en líneas concatenadas ponía
  el espacio al principio de la línea siguiente en vez de al final de la actual,
  así que en JavaScript las palabras del corte quedaban pegadas: `'aquella' +
  'vez'` da `aquellavez`. Los seis de la tanda anterior tenían el mismo
  problema. Ahora los catorce salen de un JSON que es la fuente de la verdad y
  se verifican comparando carácter por carácter contra él.
- **Hizo falta darle a las partidas simuladas su propio reloj.** No estaba
  previsto y no es del juego: el navegador frena los `setTimeout` de una pestaña
  oculta a uno por segundo, y como cada paso encadena varios, ninguna
  verificación llegaba a terminar. Sin eso no se podía comprobar nada.

## Lo que no cazó ninguna prueba, y por qué importa

Dos bugs de esta tanda pasaron todas las verificaciones que había:

- Las **palabras pegadas** pasaban cualquier prueba de largo, y el primer
  detector que escribí tampoco las veía: buscaba palabras de 19 o más letras y
  `aquellavez` tiene 10. Lo único que lo caza es comparar contra el texto
  original.
- La **fase invertida** de la luna dibujaba perfecto, sin errores en consola: un
  indicio encontrado pintaba casi luna llena y los ocho la apagaban del todo.
  Lo único que lo caza es medir que la luz crezca.

En los dos casos la prueba que servía era la que mide el resultado contra lo que
se quería, no la que comprueba que el código no explote.

## Bloqueado

Nada.

## Iteraciones

De la #108 a la #115, ocho, sobre un presupuesto de 40.
