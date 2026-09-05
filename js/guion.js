/* El guion.

   El instante no tiene escenas: tiene lugares, y el lugar es la figura que
   estás mirando. Jugás una carta, la figura se transforma, y esa cosa nueva es
   donde estás ahora. El recorrido se ramifica solo y dos partidas no se
   parecen.

   Cada lugar esconde algo. Se ve únicamente si le acertás al instante, ese
   momento en que las piezas volando se alinean. Los indicios que juntes son lo
   que decide si Bel entiende algo al despertar o se levanta sin saber.

   TODO ESTÁ EN PRIMERA PERSONA. No es un narrador contando lo que le pasa a
   Bel: es Bel contándolo mientras pasa. Cualquier texto que se agregue acá
   tiene que estar en su voz — en cuanto uno solo se escapa a la tercera, se
   nota y rompe el resto.

   Nada dice que está soñando hasta el final. Esa es la otra regla que ordena
   todo lo de abajo: la cama no aparece hasta la última pantalla, y ningún
   lugar la nombra antes. */
var Guion = (function () {
  'use strict';

  var PASOS = 8;

  /* ============ las cartas ============

     figura    a qué convierte el lugar donde estás
     revela    si es true, saca lo que ese lugar esconde (lo pone el lugar)
     accion    lo que hizo la carta, en su voz
     tono      'luz' | 'sombra' — cómo reacciona Bel y cómo suena
     astro     la correspondencia tradicional del arcano

     Los catorce son arcanos mayores reales, con su numeral y su significado.
     Ninguna carta lleva a la cama: es la única figura reservada, y se reserva
     para el último paso. */
  var CARTAS = [
    /* La carta del don. En el tarot, La Sacerdotisa es el arcano del
       conocimiento oculto: lo que se sabe sin poder explicar cómo. Es la que
       corresponde a revelar lo que un lugar esconde. */
    { clave: 'sacerdotisa', num: 'II', nombre: 'La Sacerdotisa', glifo: '☽',
      revela: true, tono: 'luz', color: '170,205,255',
      astro: '☽', astroNombre: 'la Luna',
      lectura: 'Lo que sabés sin saber cómo.',
      accion: 'Lo miré hasta que se rindió.' },

    { clave: 'torre', num: 'XVI', nombre: 'La Torre', glifo: '⚡',
      figura: 'ruina', tono: 'sombra', color: '255,150,120',
      astro: '♂', astroNombre: 'Marte',
      lectura: 'Lo mal armado se cae.',
      accion: 'Se vino abajo sin que lo tocara.' },

    { clave: 'luna', num: 'XVIII', nombre: 'La Luna', glifo: '☾',
      figura: 'luna', tono: 'sombra', color: '220,215,255',
      astro: '♓', astroNombre: 'Piscis',
      lectura: 'Nada es lo que parece.',
      accion: 'Se puso enorme y todo lo demás me quedó chiquito.' },

    { clave: 'sol', num: 'XIX', nombre: 'El Sol', glifo: '☀',
      figura: 'casa', tono: 'luz', color: '255,205,130',
      astro: '☉', astroNombre: 'el Sol',
      lectura: 'Todo queda a la vista.',
      accion: 'Se encendió, como si alguien me estuviera esperando.' },

    { clave: 'muerte', num: 'XIII', nombre: 'La Muerte', glifo: '⚱',
      figura: 'arbol', tono: 'sombra', color: '160,220,170',
      astro: '♏', astroNombre: 'Escorpio',
      lectura: 'Termina algo y arranca otra cosa.',
      /* Sin la palabra: el juego es un regalo para alguien que acaba de
         perder a su madre. El arcano se sigue llamando La Muerte porque en
         el tarot no significa morir y ella lo sabe, pero el texto que lee
         mientras juega no tiene por que decirlo. */
      accion: 'Terminó de ser lo que era, y en el mismo lugar me creció otra cosa.' },

    { clave: 'loco', num: '0', nombre: 'El Loco', glifo: '✧',
      figura: 'platillo', tono: 'luz', color: '255,220,160',
      astro: '♅', astroNombre: 'Urano',
      lectura: 'Salir sin saber a dónde.',
      accion: 'Se soltó en pedazos y los pedazos se quedaron en el aire, ' +
              'esperándome.' },

    { clave: 'enamorados', num: 'VI', nombre: 'Los Enamorados', glifo: '☍',
      figura: 'puerta', tono: 'luz', color: '230,190,220',
      astro: '♊', astroNombre: 'Géminis',
      lectura: 'Elegir deja cosas afuera.',
      accion: 'Se me abrió una salida donde no había pared.' },

    /* Lleva a la bandada y no a la calesita: la calesita ya tenia dos cartas
       propias —era, con el arbol, el doble de probable que cualquier otro
       lugar— y a la bandada no llegaba ninguna. Se veia en una partida de cada
       cien. "La vuelta entera" le sienta igual a los pajaros que van todos
       para el mismo lado. */
    { clave: 'mundo', num: 'XXI', nombre: 'El Mundo', glifo: '◎',
      figura: 'bandada', tono: 'luz', color: '200,190,240',
      astro: '♄', astroNombre: 'Saturno',
      lectura: 'La vuelta entera, por fin completa.',
      accion: 'Dio la vuelta entera y volvió al principio.' },

    { clave: 'rueda', num: 'X', nombre: 'La Rueda', glifo: '☸',
      figura: 'calesita', tono: 'luz', color: '255,190,150',
      astro: '♃', astroNombre: 'Júpiter',
      lectura: 'Lo que sube, baja, y vuelve a subir.',
      accion: 'Se puso a girar y no paró más.' },

    { clave: 'ermitano', num: 'IX', nombre: 'El Ermitaño', glifo: '⚹',
      figura: 'faro', tono: 'luz', color: '255,232,170',
      astro: '♍', astroNombre: 'Virgo',
      lectura: 'Buscar solo, con la propia luz.',
      accion: 'Quedó una sola luz, prendida por las dudas.' },

    { clave: 'estrella', num: 'XVII', nombre: 'La Estrella', glifo: '✶',
      figura: 'laguna', tono: 'luz', color: '150,175,230',
      astro: '♒', astroNombre: 'Acuario',
      lectura: 'Después del derrumbe, el agua limpia.',
      accion: 'Se me hizo agua y quedó todo quieto.' },

    { clave: 'templanza', num: 'XIV', nombre: 'La Templanza', glifo: '⚗',
      figura: 'barca', tono: 'luz', color: '170,215,215',
      astro: '♐', astroNombre: 'Sagitario',
      lectura: 'Pasar de un lado al otro, sin apuro.',
      accion: 'Le creció una vela y quedó apuntando a la otra orilla.' },

    { clave: 'colgado', num: 'XII', nombre: 'El Colgado', glifo: '⚯',
      figura: 'reloj', tono: 'sombra', color: '200,180,150',
      astro: '♆', astroNombre: 'Neptuno',
      lectura: 'Quedarse quieto y mirar al revés.',
      accion: 'Se frenó todo, menos las agujas.' },

    { clave: 'emperatriz', num: 'III', nombre: 'La Emperatriz', glifo: '✿',
      figura: 'arbol', tono: 'luz', color: '190,225,160',
      astro: '♀', astroNombre: 'Venus',
      lectura: 'Lo que cuidaste, crece.',
      accion: 'Le brotó encima algo vivo y se lo llevó puesto.' }
  ];

  function carta(clave) {
    for (var i = 0; i < CARTAS.length; i++) {
      if (CARTAS[i].clave === clave) return CARTAS[i];
    }
    return null;
  }

  /* ============ los lugares ============

     llegada  lo que pienso al aparecer acá
     vuelta   lo que pienso si ya había estado antes
     esconde  lo que veo si le acierto al instante — un pedazo de la verdad
     revela   en qué lo convierte La Sacerdotisa: lo que ese lugar era

     Todo en mi voz. Ningún texto de acá nombra la cama, ni dormir, ni
     despertarse: eso es del final. */
  var LUGARES = {
    montania: {
      nombre: 'La montaña rusa',
      llegada: 'La montaña rusa de la feria a la que me llevaban de chica. Está ' +
               'entera, y eso no puede ser: la desarmaron cuando yo tenía nueve, ' +
               'me acuerdo del terreno pelado después. Y sin embargo acá está, ' +
               'con las luces prendidas y el vagón esperando arriba de todo.',
      vuelta: 'Otra vez la montaña rusa. Está igual que hace un rato, y hace un ' +
              'rato ya estaba mal.',
      esconde: 'Las vías no terminan en ningún lado. Suben, bajan, y en la punta ' +
               'se cortan en el aire, como si nadie se hubiera tomado el trabajo ' +
               'de imaginarles un final. Nadie que las mirara desde abajo lo ' +
               'notaría. Yo las estoy mirando desde abajo.',
      revela: 'calesita'
    },
    platillo: {
      nombre: 'El platillo',
      llegada: 'Una cosa enorme, quieta en el aire, con una luz que baja hasta ' +
               'el pasto. No hace ruido, y nada que pese tanto se queda quieto ' +
               'sin hacer ruido. Igual ahí está, esperando.',
      vuelta: 'Volvió. Está en el mismo lugar exacto del aire, como si nunca ' +
              'se hubiera ido.',
      esconde: 'No vino a llevarme. Vino a decirme algo y no sabe cómo, así que ' +
               'se queda ahí arriba hasta que yo levante la cabeza. Levanto la ' +
               'cabeza. La luz se apaga despacio, como quien asiente.',
      revela: 'faro'
    },
    calesita: {
      nombre: 'La calesita',
      llegada: 'Gira despacio, con la música baja. Me tapo un oído y la sigo ' +
               'escuchando igual. No hay un solo chico arriba y va a la ' +
               'velocidad de cuando está llena, que es más lento que cuando ' +
               'está vacía. Alguien la dejó andando y se fue, o nunca hubo ' +
               'nadie y ella sola decidió que había que seguir dando vueltas.',
      vuelta: 'La calesita otra vez, con los mismos caballitos en el mismo ' +
              'orden. Ninguno se movió de lugar, ni siquiera los que estaban a ' +
              'mitad de subida.',
      esconde: 'No está apoyada. Se levantó un dedo del piso y sigue girando ' +
               'ahí arriba, con las luces del borde dando toda la vuelta para ' +
               'el mismo lado. Cuando aflojo la vista apoya de nuevo, y no ' +
               'queda marca en la tierra.',
      revela: 'arbol'
    },
    laguna: {
      nombre: 'El agua',
      llegada: 'Un agua quieta con una luz adentro. Arriba no hay nada que ' +
               'pueda estar haciendo esa luz: ni farol, ni luna en ese lado del ' +
               'cielo. La luz sale del agua, no cae sobre ella.',
      vuelta: 'El agua de nuevo. El reflejo sigue ahí, todavía sin nada arriba ' +
              'que lo explique, y a esta altura ya dejé de buscarle el origen.',
      esconde: 'Me asomo y el agua no me copia. Devuelve la orilla, los juncos, ' +
               'la luz, todo — menos a mí. Me quedo un rato largo mirando el ' +
               'lugar exacto donde tendría que estar mi cara, por si aparece ' +
               'tarde. No aparece.',
      revela: 'luna'
    },
    faro: {
      nombre: 'El faro',
      llegada: 'Un faro prendido, dando vueltas, sin mar alrededor. Nadie lo ' +
               'prendió esta noche: está prendido desde antes que yo.',
      vuelta: 'El faro otra vez. Sigue barriendo el campo vacío, con la misma ' +
              'paciencia de antes.',
      esconde: 'El haz da la vuelta entera y siempre frena un segundo de más ' +
               'cuando me pasa por encima. No está barriendo el campo: me está ' +
               'buscando a mí. Y cada vez que me encuentra sigue de largo, ' +
               'como quien se queda más tranquilo sabiendo dónde estoy.',
      revela: 'bandada'
    },
    casa: {
      nombre: 'La casa',
      llegada: 'La casa donde crecí, con las dos ventanas prendidas. Estuve ' +
               'mucho tiempo sin poder pasar por acá. Ahora la puerta está ' +
               'entornada.',
      vuelta: 'La casa de nuevo. Las luces siguen prendidas y la puerta sigue ' +
              'entornada. Nadie las apagó en todo este tiempo.',
      esconde: 'Las ventanas están prendidas pero adentro no hay lámparas: la ' +
               'casa está iluminada de la manera en que uno se acuerda de las ' +
               'casas. Está así porque yo me acuerdo así.',
      revela: 'puerta'
    },
    arbol: {
      nombre: 'El árbol',
      llegada: 'Un árbol grande, solo, con las puntas de las ramas encendidas. ' +
               'Me acuesto abajo y lo miro desde el pasto, y desde acá se ve lo ' +
               'que no se ve parada: cada rama repite la forma del árbol entero, ' +
               'y cada ramita repite la de la rama. Podría seguir mirando para ' +
               'adentro toda la noche.',
      vuelta: 'El mismo árbol. Me vuelvo a acostar abajo. Le crecieron ramas ' +
              'desde la última vez, y la última vez fue hace un minuto.',
      esconde: 'Se posa un pájaro de un color que no existe. Se queda apenas, ' +
               'y se va. No vuelve. Pero yo lo vi.',
      revela: 'luna'
    },
    reloj: {
      nombre: 'El reloj',
      llegada: 'Un reloj enorme. La aguja de los minutos va para adelante y la ' +
               'de los segundos va para atrás, y las dos me parecen tener razón.',
      vuelta: 'El reloj otra vez. Marca una hora distinta de la de recién, y ' +
              'ninguna de las dos es la de verdad.',
      esconde: 'Los números se corrieron de su hora: cada uno anda cerca del ' +
               'lugar que le tocaba, sin terminar de estar en ninguno. La culpa ' +
               'de todo la tiene el tiempo, que se empeña en transcurrir. Si se ' +
               'quedara quieto un rato, aunque sea un rato, nada de lo que pasó ' +
               'habría tenido que pasar.',
      revela: 'casa'
    },
    luna: {
      nombre: 'La luna',
      llegada: 'La luna, bajísima, ocupando medio cielo. La puedo mirar de ' +
               'frente sin que moleste, y eso también está mal: mirarla de ' +
               'frente tendría que costarme algo. Está tan cerca que le veo el ' +
               'borde recortado contra el aire.',
      vuelta: 'La luna de nuevo, todavía más cerca. Cada vez que vuelve está un ' +
              'poco más cerca, y ninguna de las veces me pareció que se hubiera ' +
              'movido.',
      esconde: 'Los cráteres se mueven. Despacio, pero se mueven, y se acomodan ' +
               'como se acomoda una cara que está por decir algo y todavía busca ' +
               'por dónde empezar. Me quedo esperando. No dice nada, pero se ' +
               'queda mirándome.',
      revela: 'laguna'
    },
    puerta: {
      nombre: 'La puerta',
      llegada: 'Una puerta parada sola, sin pared, con luz atrás. Veo el campo ' +
               'de los dos lados y aun así hay luz atrás. La rodeo entera para ' +
               'entender de dónde sale: desde el otro lado también hay luz ' +
               'atrás, y atrás vuelve a ser este lado.',
      vuelta: 'La puerta otra vez. La luz de atrás sigue prendida, y del otro ' +
              'lado sigue sin haber un otro lado.',
      esconde: 'La abro y del otro lado está el mismo campo. La cierro, la ' +
               'vuelvo a abrir, y ahora hay una habitación. Cierro los ojos y ' +
               'pruebo esperar otra cosa, a ver hasta dónde llega esto.',
      revela: 'casa'
    },
    ruina: {
      nombre: 'Lo que quedó',
      llegada: 'Escombros. Se cayó algo grande y yo no escuché nada, y no puede ' +
               'ser que no haya escuchado. El polvo todavía está en el aire, ' +
               'quieto, sin decidirse a bajar. Camino alrededor buscando de qué ' +
               'era esto y no encuentro una sola pieza que me lo diga.',
      vuelta: 'Otra vez los escombros. El polvo sigue sin bajar. Hace un rato ' +
              'larguísimo que sigue sin bajar, y ya me parece que no va a bajar ' +
              'nunca.',
      esconde: 'Levanto un pedazo y abajo no hay tierra: hay más pedazos, y ' +
               'abajo más. Esto no se cayó de ningún lado. Lo armaron ya roto, y ' +
               'yo llegué después a buscarle una explicación que no tiene.',
      // De los escombros, el tiempo: el arbol ya era el destino mas
      // frecuente del juego y el reloj no lo era de casi nadie.
      revela: 'reloj'
    },
    bandada: {
      nombre: 'Los pájaros',
      llegada: 'Un montón de pájaros cruzando, todos para el mismo lado. No se ' +
               'acaban nunca: hace rato que cruzan y siguen viniendo desde atrás ' +
               'del cielo, como si alguien los estuviera soltando de a puñados y ' +
               'no se cansara.',
      vuelta: 'Los pájaros otra vez, cruzando para el mismo lado. Puede que ' +
              'sean los mismos dando la vuelta, y puede que la vuelta sea ' +
              'cortita.',
      esconde: 'Ninguno bate las alas al mismo tiempo que otro, salvo cuando los ' +
               'miro. Cuando los miro, se sincronizan. Cuando aflojo la vista, ' +
               'se desordenan otra vez. Pruebo tres veces para estar segura y ' +
               'las tres veces me hacen caso.',
      revela: 'casa'
    },
    barca: {
      nombre: 'La barca',
      llegada: 'Una barca con la vela puesta, meciéndose fuerte. No hay agua ' +
               'abajo: se mece igual, como si abajo hubiera una tormenta que ' +
               'solo ella siente. La vela está tensa de un viento que no me ' +
               'despeina.',
      vuelta: 'La barca otra vez, meciéndose sobre nada. Sigue igual de ' +
              'sacudida y sigue en el mismo lugar, que es lo raro de todo esto.',
      esconde: 'Está atada, y la soga se pierde en el aire. La sigo con la ' +
               'vista y en algún punto simplemente deja de existir. Eso es lo ' +
               'que la salva: la sacude todo y no se va a ningún lado.',
      revela: 'laguna'
    },
    cama: {
      nombre: 'La cama',
      llegada: 'Mi cama. La mía, con mis sábanas, la mancha de tinta de aquella ' +
               'vez, todo. Puesta en el medio del campo como si alguien la ' +
               'hubiera traído hasta acá y se hubiera ido sin explicar nada. Es ' +
               'lo único de todo esto que no me sorprende, y eso es lo que más ' +
               'me sorprende.',
      vuelta: 'Mi cama, otra vez. Sigue igual de hecha y sigue igual de mía, ' +
              'con la misma arruga en el mismo lado, y yo sigo sin acordarme de ' +
              'haberla dejado acá ni de haberme levantado de ella.',
      /* Sin la palabra: el dibujo ya la muestra ahi. Que se vea es mas fuerte
         que que se lo digan, y ademas ningun texto del juego nombra lo que
         esta pasando de verdad — este era el unico que se escapaba. */
      esconde: 'Estoy yo adentro. Con la cara para el lado de la ventana y ' +
               'una mano afuera de las sábanas, como la dejo siempre. No me ' +
               'muevo. Me quedo un rato mirándome.',
      revela: 'puerta'
    }
  };

  /* El lugar donde arranca. Algo raro pero terrestre: nada que delate de
     entrada que esto no está pasando. */
  /* Los tres tramos del sueno.

     El recorrido dejo de ser suelto. Hay un tramo donde se elige libre, uno
     donde NO se puede elegir — la mano viene con una sola carta — y uno donde
     se vuelve a elegir pero con menos mazo. Eso no se explica en ningun texto:
     se entiende jugando, y es lo unico que el juego dice sobre lo que le toco
     a quien lo juega.

     `hasta` es el numero de paso hasta el que rige el tramo, inclusive. */
  var TRAMOS = [
    // Lo que fue. Los recuerdos: se elige con el mazo entero del tramo.
    { nombre: 'fue', hasta: 3, libre: true,
      lugares: ['arbol', 'calesita', 'laguna', 'luna'] },
    /* Lo que paso. En orden y sin alternativa.

       Primero el derrumbe y despues la barca, y no al reves. Estaba al reves y
       contaba otra cosa sin querer: como cada carta transforma un lugar en el
       siguiente, lo que se veia en pantalla era la barca desarmandose en
       escombros — o sea, lo unico que la sostiene haciendose pedazos. Ahora es
       al derecho: se cayo algo enorme y no hay explicacion, y de esos mismos
       pedazos se arma algo que se mece fuerte y no se va a ningun lado. El
       tramo del dolor termina en lo que la salva y no en lo que se cayo. */
    { nombre: 'paso', hasta: 5, libre: false,
      orden: ['ruina', 'barca'] },
    /* Lo que queda. Se vuelve a elegir, con lo que sobro del mazo.

       Los pajaros entran aca. Eran el unico de los catorce lugares que no
       pertenecia a ningun tramo: se les dio carta propia para que se vieran
       —antes salian en una partida de cada cien— pero al no estar en ningun
       tramo, llegar ahi era siempre salirse de la estructura. Van con estos y
       no con los recuerdos porque no cuentan nada de antes: son ella probando
       si el sueno le responde, como la puerta, y de hecho revelan la casa. */
    { nombre: 'queda', hasta: 7, libre: true,
      lugares: ['faro', 'platillo', 'casa', 'reloj', 'puerta', 'bandada'] }
  ];

  /* En que tramo cae un paso. `paso` es el que se esta por jugar, contando
     desde 0. El ultimo siempre es la cama y no pertenece a ningun tramo. */
  function tramoDe(paso) {
    for (var i = 0; i < TRAMOS.length; i++) {
      if (paso < TRAMOS[i].hasta) return TRAMOS[i];
    }
    return null;
  }

  /* Cuando el tramo es forzado, cual es el lugar que toca. */
  function forzado(paso) {
    var t = tramoDe(paso);
    if (!t || t.libre) return null;
    var desde = t.hasta - t.orden.length;
    return t.orden[paso - desde] || null;
  }

  var ARRANQUE = 'montania';

  function lugar(clave) { return LUGARES[clave]; }

  /* Qué figura sale de jugar esta carta acá. */
  function destino(claveCarta, claveLugar) {
    var c = carta(claveCarta);
    if (!c) return null;
    if (c.revela) {
      var l = LUGARES[claveLugar];
      return l ? l.revela : null;
    }
    return c.figura;
  }

  /* ============ el final ============

     El despertar, también en su voz. Lo que entiende depende de cuánto llegó a
     ver: no es un puntaje, es cuánto pudo atar. */
  /* Cada indicio, dicho en cuatro o cinco palabras. Sirven para que el cierre
     pueda nombrar lo que se vio sin repetir el parrafo entero. */
  var ETIQUETA = {
    montania: 'Las vías cortadas en el aire',
    platillo: 'La luz que se apagó como quien asiente',
    calesita: 'La calesita que no tocaba el piso',
    laguna: 'El agua que no me copiaba',
    faro: 'El haz que frenaba cuando me encontraba',
    casa: 'La luz sin lámparas',
    arbol: 'El pájaro de un color que no existe',
    reloj: 'Los números corridos de su hora',
    luna: 'La cara que armaban los cráteres',
    puerta: 'La habitación que apareció porque la esperé',
    ruina: 'Los pedazos abajo de los pedazos',
    bandada: 'Los pájaros que se ordenaban cuando los miraba',
    barca: 'La soga atada a nada',
    /* La etiqueta va a la cita del cierre, asi que tampoco puede decirlo: si
       no, el final termina nombrando justo lo unico que el juego nunca nombra. */
    cama: 'Yo, ahí adentro'
  };

  /* De los textos de indicio guardados, a qué lugares corresponden. */
  function lugaresVistos(indicios) {
    var claves = [];
    Object.keys(LUGARES).forEach(function (k) {
      if (indicios.indexOf(LUGARES[k].esconde) !== -1) claves.push(k);
    });
    return claves;
  }

  /* Hasta `cuantos` etiquetas de lo visto, como oraciones. Si los indicios no
     son de verdad —las pruebas cargan textos inventados— devuelve vacío y el
     texto que lo use tiene que sobrevivir sin la lista. */
  function citaDeVistos(indicios, cuantos) {
    var claves = lugaresVistos(indicios).slice(0, cuantos);
    if (!claves.length) return '';
    return ' ' + claves.map(function (k) { return ETIQUETA[k] + '.'; }).join(' ');
  }

  function final(indicios, recorrido) {
    var n = indicios.length;

    if (n === 0) {
      return {
        titulo: 'Me desperté',
        partes: [
          'Abrí los ojos a las cuatro y monedas. Mi cuarto, mi techo, la ' +
          'persiana con la misma raya de luz de siempre.',
          'No me quedó nada. Un campo, cosas grandes, la sensación de haber ' +
          'estado por entender algo y no haber llegado.',
          'Me di vuelta y cerré los ojos otra vez. A veces pasa: una estuvo ahí ' +
          'y no vio nada.'
        ]
      };
    }
    if (n <= 2) {
      return {
        titulo: 'Me quedó algo',
        partes: [
          'Abrí los ojos a las cuatro y monedas, con la cabeza en una cosa ' +
          'suelta que había visto y no sabía dónde poner.',
          'No me acordaba de todo. Me acordaba de un detalle, nítido, de esos ' +
          'que quedan cuando lo demás se borra.',
          'Me pasa seguido, despierta: retengo la única cosa rara de una ' +
          'escena que a todos los demás les pareció normal.'
        ]
      };
    }
    if (n <= 4) {
      return {
        titulo: 'Até unos cabos',
        partes: [
          'Abrí los ojos a las cuatro y monedas y me quedé quieta, juntando las ' +
          'piezas antes de que se me fueran.',
          'Nada de lo que había visto encajaba, y todas las cosas que no ' +
          'encajaban fallaban de la misma manera: se acomodaban cuando yo las ' +
          'miraba.' + citaDeVistos(indicios, 2),
          'Ahí entendí lo primero: todo eso lo armé yo, con lo puesto.'
        ]
      };
    }
    return {
      titulo: 'Entendí',
      partes: [
        'Abrí los ojos a las cuatro y monedas, con esa claridad rara de cuando ' +
        'algo te queda en la mano.',
        'Lo importante era cómo me di cuenta: cada cosa de ese lugar estaba ' +
        'esperando que yo la mirara para terminar de existir.' +
        citaDeVistos(indicios, 3),
        'Me quedé mirando la raya de luz de la persiana un rato largo.'
      ]
    };
  }

  /* ============ la carta que es de ella ============

     El arcano XXII no existe en ninguna baraja y no se reparte nunca. Se da
     vuelta al final, una sola vez, y es el único momento en que alguien le
     habla a Bel en lugar de que hable ella. Por eso va en segunda persona: es
     la carta dirigiéndose a quien acaba de jugar.

     Cuál de las cuatro toca depende de cuánto llegó a ver. Es la misma figura
     en cuatro grados. */
  function cartaDeElla(indicios) {
    var n = indicios.length;

    if (n >= 8) {
      return {
        clave: 'astrologa', num: 'XXII', nombre: 'La Astróloga',
        lectura: 'Mirar hasta que la cosa se rinde.',
        astro: '☽', astroNombre: 'la Luna',
        parrafos: [
          'Viste ' + n + ' de las ocho cosas que había para ver. ' +
          (n === 8 ? 'Todas.' : 'Casi todas.'),
          'Eso no es suerte ni puntería. Es que mirás distinto: te quedás en una ' +
          'cosa hasta que la cosa se rinde y te muestra lo que es. Toda la noche ' +
          'estuviste haciendo eso, y a esta altura ya sabés que no lo hacés solo ' +
          'cuando dormís.',
          'Lo hacés cuando alguien se sienta enfrente tuyo y te pide que le leas ' +
          'algo. Lo hacés cuando escuchás a alguien contar un problema y ves, ' +
          'antes que la persona, dónde está el nudo. No lo aprendiste en ningún ' +
          'lado. Es tu don.',
          'Seguí. Hay gente esperando que le mires las cosas.'
        ]
      };
    }
    if (n >= 5) {
      return {
        clave: 'testigo', num: 'XXII', nombre: 'La Testigo',
        lectura: 'Quedarse el segundo de más.',
        astro: '☽', astroNombre: 'la Luna',
        parrafos: [
          'Viste ' + n + ' de las ocho cosas que había para ver. Algunas se te ' +
          'pasaron.',
          'Está bien que se pasen. Nadie mira todo, y las que viste no las viste ' +
          'de casualidad: las viste porque te quedaste el segundo de más que la ' +
          'mayoría no se queda.',
          'Ese segundo de más es todo el asunto. Es lo que hacés cuando alguien ' +
          'te cuenta algo y vos ves lo que no dijo. No es magia y no hace falta ' +
          'que lo sea.',
          'Seguí. Hay gente esperando que le mires las cosas.'
        ]
      };
    }
    if (n >= 1) {
      return {
        clave: 'despierta', num: 'XXII', nombre: 'La Que Se Despierta',
        lectura: 'Con una alcanza para saber que se puede.',
        astro: '☽', astroNombre: 'la Luna',
        parrafos: [
          'Viste ' + n + (n === 1 ? ' de las ocho cosas que había para ver' : ' de las ocho cosas que había para ver') +
          '. Se te fue casi todo.',
          'Pasa cuando uno mira sin mirar, que es como andamos la mayor parte del ' +
          'tiempo. Igual algo viste, y esa cosa te la llevás.',
          'Con una alcanza para saber que se puede. Lo demás es acordarse de ' +
          'frenar, que es lo difícil.',
          'Seguí. Hay gente esperando que le mires las cosas.'
        ]
      };
    }
    return {
      clave: 'durmiente', num: 'XXII', nombre: 'La Durmiente',
      lectura: 'Pasar al lado y seguir de largo.',
      astro: '☽', astroNombre: 'la Luna',
      /* Un final valido, no un fracaso. No pide revancha ni sugiere que le
         fue mal: lo unico que hace es dejar las cosas donde estan. La
         invitacion es que sigan ahi, no que vuelva a intentarlo. */
      parrafos: [
        'No viste ninguna. Ocho veces algo estuvo a punto de mostrarse, y las ' +
        'ocho veces siguió de largo.',
        'No es un reproche ni una lástima: así se atraviesa casi todo. Uno ' +
        'pasa al lado de las cosas raras y sigue de largo, porque tiene cosas ' +
        'que hacer y porque no siempre hay con qué frenar.',
        'Y sin embargo lo hiciste entero. Todo lo que hubo esta noche lo ' +
        'pusiste vos, incluso lo que no llegaste a mirar.',
        'Las cosas siguen ahí. No se van a ningún lado.'
      ]
    };
  }

  /* ============ la carta, la de papel ============

     Lo único del juego que no es del sueño. El arcano XXII habla de lo que hizo
     el jugador; esto lo escribe Nico y va directo a Bel.

     Es un borrador: la idea es que Nico lo reescriba con sus palabras. Está
     armado para que se pueda cambiar entero sin tocar nada más — un array de
     párrafos y la firma. */
  /* La carta de papel. La escribio Nico, palabra por palabra: es la unica
     parte del juego donde no habla Bel ni habla el juego. No tocar el texto —
     ni para acortarlo, ni para emprolijarlo, ni para arreglarle la puntuacion.
     Si algo no entra en pantalla, se agranda la hoja, no se recorta la carta. */
  var CARTA_PARA_BEL = {
    parrafos: [
      'Bel:',

      'Si llegaste hasta acá, significa que terminaste el juego. Espero que te ' +
      'haya gustado jajaja.',

      'Simplemente quería hacer algo distinto para alguien que, de una forma u ' +
      'otra, sigue siendo muy importante para mí.',

      'Pasaron muchas cosas desde que nos conocimos. Algunas fueron hermosas, ' +
      'otras fueron bastante difíciles. Nos acercamos, nos alejamos y nos ' +
      'volvimos a encontrar...',

      'Sé que atravesaste cosas muy difíciles, especialmente estos últimos ' +
      'meses. No hay casi nada que pueda decir sobre eso que realmente alcance. ' +
      'Solamente espero que, con el tiempo, puedas encontrar un poquito de paz ' +
      'y que los recuerdos lindos que tengas puedan pesar más que el dolor.',

      'Y sobre todo, espero que de a poquito puedas volver a sonreír, disfrutar ' +
      'de las cosas, hacer planes, reírte mucho y sentirte orgullosa de la ' +
      'persona que sos. Que puedas seguir creciendo, cumpliendo tus sueños y ' +
      'construyendo una vida llena de cosas lindas.',

      'Porque creo que hay personas que dejan algo de ellas en nosotros que ' +
      'merece seguir viviendo. Y quizás una de las formas más lindas de ' +
      'llevarlas siempre con nosotros sea simplemente vivir, ser feliz, ' +
      'disfrutar de la vida y hacer de todo eso nuestro motor.',

      'Por mi parte, me quedo con las veces que nos reímos, con las cosas que ' +
      'compartimos y con todos los recuerdos hermosos que tuvimos. Con esos ' +
      'momentos en los que simplemente la pasamos tan lindo. Me quedo con todo ' +
      'eso, que fue nuestro.',

      /* El ¿Si, Bel? va pegado al parrafo y no en un renglon aparte: dos
         parrafos mas abajo hay un "Si." solo, que es el golpe mas fuerte de la
         carta, y dos frases sueltas tan cerca se roban el efecto entre ellas. */
      'Quería que supieras que hay una parte de mí que siempre va a guardar un ' +
      'lugar lindo para vos, y que pase lo que pase siempre vas a poder contar ' +
      'conmigo. ¿Sí, Bel?',

      'Y si alguna vez te preguntás si todo aquello significó algo para mí...',

      'Sí.',

      'Significó mucho. Y fue muy especial.',

      'Gracias por ser parte de mi vida, Bel.',

      'Y gracias por ser vos. Por ser única y especial para mí.',

      'Te quiero mucho, bbita. ❤️'
    ],
    firma: 'Nico'
  };

  return {
    PASOS: PASOS, ARRANQUE: ARRANQUE,
    TRAMOS: TRAMOS, tramoDe: tramoDe, forzado: forzado,
    CARTAS: CARTAS, LUGARES: LUGARES, CARTA_PARA_BEL: CARTA_PARA_BEL,
    carta: carta, lugar: lugar, destino: destino,
    final: final, cartaDeElla: cartaDeElla
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Guion; }
