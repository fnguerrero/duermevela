/* El juego.

   Ocho pasos. En cada uno estás en un lugar, te reparten tres cartas, jugás
   una, y el lugar se transforma en lo que esa carta trae: esa cosa nueva es
   donde estás ahora. Por eso el recorrido se ramifica solo — no hay una lista
   de escenas, hay una cadena.

   Mientras las piezas vuelan hay un instante para mirar. Si le acertás, ves lo
   que ese lugar escondía y te lo llevás. Los indicios que juntes son lo único
   que decide el final.

   La cama está prohibida hasta el último paso. Es la revelación y no se
   regala antes. */
(function () {
  'use strict';

  var cv = document.getElementById('c'), cx = cv.getContext('2d');
  var W = 0, H = 0, t = 0;

  function medir() {
    /* Tope de densidad. En una pantalla muy grande y densa, pintar a 2x son
       cuatro veces mas pixeles por cuadro sin diferencia visible a esa escala. */
    var d = window.devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    if (W * H > 2200 * 1300) d = Math.min(d, 1.25);
    else d = Math.min(d, 2);
    // Sin layout (pestaña oculta) el canvas queda en 0 y cualquier captura sale
    // vacía; con un tamaño de respaldo el juego se puede revisar igual.
    if (W < 2 || H < 2) { W = 1280; H = 760; }
    cv.width = W * d; cv.height = H * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
  }
  window.addEventListener('resize', medir);
  /* El evento resize no siempre llega: no se dispara cuando la ventana cambia
     con la pestana en segundo plano, ni en varios casos de zoom o de paneles
     embebidos. El sintoma es feo y silencioso — el canvas queda con el buffer
     de un tamano viejo y la escena se dibuja para una pantalla que ya no
     existe. Por eso el tamano se comprueba en cada cuadro: son dos lecturas
     de layout y evitan depender de que el evento llegue. */
  function revisarTamanio() {
    if (cv.clientWidth >= 2 && cv.clientHeight >= 2 &&
        (cv.clientWidth !== W || cv.clientHeight !== H)) {
      medir();
      medirMano();
      return true;
    }
    return false;
  }
  medir();

  var elRelato = document.getElementById('relato');
  var elMano = document.getElementById('mano');
  var elRotulo = document.getElementById('rotulo');
  var elRestan = document.getElementById('restan');
  var elMarcador = document.getElementById('marcador');
  var elCuentas = document.getElementById('cuentas');
  var elCierre = document.getElementById('cierre');
  var elAviso = document.getElementById('aviso');
  var elGuia = document.getElementById('guia');

  var bel = Bel.crear();

  /* Cada vez que el jugador toca, ella cierra los ojos un momento. Lo que ve
     no esta afuera: el sueno lo esta mirando desde adentro. */
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (ev === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      bel.adentro = 1;
    }, true);
  });
  var cielo = Cielo.crear();
  /* La luna de verdad de esta noche. De todo el calculo de efemerides solo se
     usa el signo: la FASE no es la real, porque en el sueno la marca lo que
     ella va encontrando. Que el signo si sea el verdadero es el guino: si lo
     mira, coincide con el cielo de afuera. */
  var lunaReal = (typeof Luna !== 'undefined') ? Luna.estado() : null;
  var mirada = Instante.crear();

  /* Multiplicador de velocidad. Vale 1 jugando; una prueba automática lo sube
     para recorrer una partida entera en segundos en vez de en minutos. */
  /* Todo el juego, un 20% mas lento. Las transformaciones, las entradas y
     las esperas entre pasos: iba a un ritmo que no dejaba mirar nada. */
  var RITMO_NORMAL = .8;
  var RITMO = RITMO_NORMAL;

  /* Dos cosas distintas que antes eran una sola.

     `enPrueba` es el simulador: los tiempos van por una cola propia que avanza
     a mano, porque el navegador frena los timers de una pestana oculta.
     `RAPIDO` es el modo para probar el juego a mano sin esperar los tiempos
     de lectura. Mezclarlos —usando RITMO > 1 para las dos— hacia que subir la
     velocidad mandara los timers a una cola que nadie iba a avanzar, y el
     juego se trababa entero. */
  var enPrueba = false;
  var RAPIDO = false;
  var RITMO_RAPIDO = 3;
  /* Todos los temporizadores del juego pasan por aca y quedan anotados. Sin un
     registro, reiniciar una partida deja vivos los `setTimeout` de la anterior
     y el juego avanza dos veces por cada paso. */
  var relojes = [];

  /* Reloj propio para las partidas simuladas.

     El navegador frena los setTimeout de una pestana oculta a uno por segundo.
     Como cada paso del juego encadena varios, una partida simulada tardaba
     minutos en avanzar un solo lugar y ninguna verificacion llegaba a
     terminar. En modo prueba los tiempos se llevan en una cola propia que
     avanza con el mismo pulso que adelanta los cuadros: el juego corre a la
     velocidad de la maquina y no a la del reloj de la pestana. */
  var colaPrueba = [], relojPrueba = 0;

  function avanzarRelojPrueba(ms) {
    relojPrueba += ms;
    // Se copia y se vacia antes de disparar: un fn puede encolar mas trabajo.
    for (var v = 0; v < 200 && colaPrueba.length; v++) {
      var listos = colaPrueba.filter(function (c) { return c.vence <= relojPrueba; });
      if (!listos.length) return;
      colaPrueba = colaPrueba.filter(function (c) { return c.vence > relojPrueba; });
      listos.sort(function (a, b) { return a.vence - b.vence; });
      listos.forEach(function (c) { c.fn(); });
    }
  }

  function luego(ms, fn) {
    if (enPrueba) {
      var tarea = { vence: relojPrueba + ms / RITMO, fn: fn };
      colaPrueba.push(tarea);
      return tarea;
    }
    var id = setTimeout(function () {
      var i = relojes.indexOf(id);
      if (i !== -1) relojes.splice(i, 1);
      fn();
    }, ms / RITMO);
    relojes.push(id);
    return id;
  }
  /* Al reiniciar hay que soltar la espera igual que los relojes: si no, el
     click de la partida nueva dispara el avance de la anterior. */
  function frenarRelojes() {
    if (typeof cancelarEspera === 'function') cancelarEspera();
    colaPrueba = [];
    J.congelado = false;
    relojes.forEach(clearTimeout);
    relojes = [];
  }

  /* ---------- estado ---------- */
  var J = {
    paso: 0,
    lugar: Guion.ARRANQUE,
    visitados: {},          // lugares por los que ya pasó
    recorrido: [],          // la cadena de figuras, en orden
    indicios: [],           // lo que llegó a ver
    perdidos: [],           // lo que estuvo ahí y no llegó a ver
    jugando: false,         // hay una jugada en curso: no aceptar otra
    congelado: false,       // la transformacion frenada mientras se lee un indicio
    revelando: 0,           // cuanto se ve la anomalia del lugar, de 0 a 1
    seguirPaso: null,       // como sigue el paso cuando termine de leerse
    guias: {},              // que avisos de la primera partida ya salieron
    siguioDeLargo: 0,       // cuantas veces eligio no quedarse a mirar
    ultimoTic: -1,          // para no repetir el tic del anillo
    esconde: null,          // lo que esconde el lugar del que se está yendo
    vioAhora: null,         // indicio recién descubierto, para contarlo
    mazo: Guion.CARTAS.map(function (c) { return c.clave; }),
    jugadas: [],
    andando: false,
    // La transformación en curso.
    color: '210,190,255',
    pares: null,
    u: 1,
    destino: null,
    fogonazo: 0,
    destello: 0,            // el golpe de luz al terminar una mutacion
    // Bel entra caminando en cada paso.
    belX: .18,                // en el cuadro desde el arranque, no fuera
    belMeta: .26,
    ultimaFy: 0,
    corrimientoMano: 0,     // cuanto se corre la mano para centrarla en la escena
    /* Cuanto sabe el sueno que lo estan descubriendo. Sube con cada prueba
       encontrada y tine todo: el ritmo de las figuras, el color del cielo, la
       fuerza de los halos. Es lo que hace que acertar se sienta, en vez de
       sumar un numero en una esquina. */
    tension: 0,
    tensionSuave: 0,        // la misma, alcanzada despacio
    climax: 0               // el ultimo paso: 0 a 1 mientras dura
  };

  /* ---------- utilidades ---------- */

  function mezclarColor(a, b, u) {
    var A = a.split(',').map(Number), B = b.split(',').map(Number);
    return A.map(function (v, i) { return Math.round(v + (B[i] - v) * u); }).join(',');
  }

  /* Cuanto queda un texto en pantalla antes de seguir. Va por largo, no por un
     numero fijo: los textos van de 60 a 170 caracteres y con un tiempo unico o
     el corto se eterniza o el largo no se llega a leer. Unos 52 ms por caracter
     es lectura tranquila en voz baja, mas un resto para arrancar. */
  /* Cuanto tarda en leerse. Ya no decide cuando avanza el juego — eso lo
     decide el jugador — pero sigue sirviendo para saber a partir de cuando
     tiene sentido ofrecerle seguir. */
  /* Cuanto de la luna esta iluminado: exactamente lo que se lleva encontrado.
     Es la misma cuenta con la que se elige el arcano XXII, asi que al final la
     carta y la luna del cielo dicen lo mismo — y la carta no le revela nada
     que no estuviera ahi arriba toda la partida. */
  function faseLuna() {
    return Math.max(0, Math.min(1, J.indicios.length / Guion.PASOS));
  }

  /* El eje de la escena.

     El relato, el rotulo y la mano son elementos HTML centrados en la ventana:
     estan los tres en el 0,500 exacto. La figura estaba en 0,560 y el anillo
     del instante y el resplandor del fondo la seguian, asi que todo el dibujo
     quedaba corrido un 6% respecto del texto y de las cartas — que en una
     pantalla de mil pixeles son sesenta, y se ve.

     Ahora es uno solo y es el centro de verdad. A Bel le queda menos lugar a la
     izquierda, y por eso su marca pasa a medirse contra el borde de la figura
     en vez de contra una fraccion fija del ancho. */
  function ejeFigura() {
    return W * .50;
  }

  function tiempoDeLectura(texto) {
    return Math.max(2200, Math.min(9000, 900 + texto.length * 52));
  }

  /* El relato espera.

     Antes se iba solo a los 15 caracteres por segundo, que es la velocidad
     maxima a la que lee alguien concentrado y sin nada mas pasando — y aca
     ademas hay una animacion, una mecanica que aprender y una carta que
     elegir. Cualquier numero iba a ser rapido para uno y lento para otro, y
     en la primera partida siempre rapido. La habilidad del juego esta en el
     instante de mirar, no en leer contra reloj: el texto se queda hasta que
     el jugador dice seguir. */
  var esperando = null, fichaEspera = 0;
  var elSeguir = document.getElementById('seguir');

  function avanzar() {
    if (!esperando) return;
    /* Con la ventana del instante abierta el toque es para el anillo — pero
       solo si todavia no se resolvio. Con la guarda puesta a secas se trababa
       el juego: al acertar, el mundo se congela para leer el indicio, y la
       ventana no se cierra hasta que la transformacion termine, cosa que no
       pasa porque justamente esta congelada. El toque quedaba bloqueado contra
       una ventana que esperaba ese mismo toque. */
    if (mirada && mirada.activo && !mirada.resuelto) return;
    var fn = esperando;
    esperando = null;
    elSeguir.classList.remove('ver');
    fn();
  }

  function pedirSeguir(fn, msLectura) {
    /* En las partidas simuladas no hay nadie para tocar. Ahi el texto vuelve
       a avanzar solo, porque si no las pruebas se cuelgan esperando un click
       que nunca llega. Y en modo rapido tampoco se espera el toque: la idea
       es justamente no tener que ir tocando para ver el juego entero. */
    if (enPrueba) { luego(msLectura, fn); return; }
    if (RAPIDO) { luego(Math.min(900, msLectura * .35), fn); return; }
    var mia = ++fichaEspera;
    esperando = null;
    /* El avance no se habilita junto con el texto, sino con el aviso. Los dos
       llegan tarde a proposito: el jugador viene de tocar el anillo, y si el
       relato aceptara el toque desde el primer milisegundo, el gesto de la
       mecanica anterior se lo saltea sin que llegue a leer una palabra. */
    /* 260ms en vez de 900: alcanza para descartar el toque que sobra de la
       mecanica anterior, y no deja al jugador esperando sin saber si el juego
       sigue vivo. La demora tiene que ser corta pero no cero, porque en este
       mismo punto se habilita el toque: mostrar el boton antes seria ofrecer
       algo que todavia no responde. */
    luego(260, function () {
      if (mia !== fichaEspera) return;
      esperando = fn;
      elSeguir.classList.add('ver');
    });
  }

  /* Los botones del final llegan uno atras del otro y todos en el centro de la
     pantalla — que es justo donde el jugador viene tocando para pasar los
     textos. Sin esta demora, un toque que sobra dispara el boton que acaba de
     aparecer, y el que jugo ve pasar de largo el cierre, el arcano y el sobre
     sin haber leido ninguno. */
  function habilitarLuego(boton, ms) {
    boton.disabled = true;
    boton.style.pointerEvents = 'none';
    luego(ms || 1100, function () {
      boton.disabled = false;
      boton.style.pointerEvents = '';
    });
    return boton;
  }

  function cancelarEspera() {
    fichaEspera++;
    esperando = null;
    if (elSeguir) elSeguir.classList.remove('ver');
  }

  function decir(texto, alTerminar) {
    elRelato.classList.remove('ver');
    cancelarEspera();
    luego(700, function () {
      elRelato.textContent = texto;
      elRelato.classList.add('ver');
      if (alTerminar) pedirSeguir(alTerminar, tiempoDeLectura(texto));
    });
  }

  /* Dónde apoya cada figura (1 = su borde de abajo). null = flota. */
  var BASES = {
    montania: 1, ruina: 1, arbol: 1, casa: .96, puerta: .90, cama: .62,
    calesita: .68, faro: 1, laguna: 1, reloj: 1,
    platillo: null, luna: null, bandada: null, barca: null
  };

  /* Dónde se planta Bel, como fracción del ancho: cuanto más grande es lo que
     mira, más lejos se para. */
  var LEJANIA = {
    cama: .30, casa: .26, puerta: .30, calesita: .24,
    laguna: .16, faro: .22, reloj: .26, montania: .18
  };

  /* La altura a la que va la figura. Durante una transformación interpola entre
     las dos, así una casa que se vuelve platillo despega en vez de saltar. */
  function alturaDe(figura, destino, u, piso, E) {
    var aire = piso - E * 1.02;
    function y(clave) {
      var b = BASES[clave];
      return (b === null || b === undefined) ? aire : piso - E * b;
    }
    var a = y(figura);
    if (!destino) return a;
    var b = y(destino.figura);
    var f = u * u * (3 - 2 * u);
    return a + (b - a) * f;
  }

  /* Donde empieza la mano de cartas, en pixeles desde arriba. Se cachea porque
     leer el layout en cada cuadro fuerza un reflow; se invalida cuando cambia
     el tamano o cuando se reparte. */
  var _techoMano = 0;
  function medirMano() {
    var r = elMano.getBoundingClientRect();
    /* Una mano sin cartas igual mide alto: el alto sale del CSS, no del
       contenido. Preguntar solo por la altura daba por buena una mano que no
       existia y el piso se subia media pantalla — se veia mientras el relato
       espera, que es justo cuando todavia no se reparte nada. Lo que decide es
       si hay cartas y si no se fueron. */
    var hay = elMano.children.length > 0 && !elMano.classList.contains('fuera');
    _techoMano = (hay && r.height > 4) ? r.top : H * .78;
    return _techoMano;
  }
  function techoMano() {
    return _techoMano || medirMano();
  }

  /* Reparte, pero no cualquier cosa.

     Una carta que transforma el lugar en el mismo lugar no hace nada, y una
     que te devuelve a donde ya estuviste se lee como que el juego se rompio,
     no como que el sueno se repite. Asi que la mano se arma priorizando las
     que llevan a algo nuevo, y solo se relaja si no alcanzan. */
  function mezclar(a) {
    var c = a.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = c[i]; c[i] = c[j]; c[j] = x;
    }
    return c;
  }

  /* La Muerte no se reparte en la primera mano. El juego es un regalo para
     alguien concreto, y abrirle con esa carta es un golpe que no aporta nada:
     mas adelante, con el sueno ya en marcha, se lee distinto. */
  var NO_AL_ARRANQUE = ['muerte'];

  /* La mano.

     El reparto es lo que hace sentir la estructura del sueno sin explicarla.
     En los tramos libres se ofrecen las cartas que llevan a los lugares de ese
     tramo, priorizando las que abren lugar nuevo. En el tramo forzado se
     reparte UNA sola carta: la que lleva a donde hay que ir. El jugador
     estira la mano para elegir y descubre que no hay nada que elegir.

     Eso no lleva ningun texto. Se entiende jugandolo. */
  function repartir(n) {
    var todas = mezclar(J.mazo);

    // El tramo sin eleccion: una carta, la que toca, y si no esta en el mazo
    // se busca igual — la estructura no puede depender de la suerte del mazo.
    var obligado = Guion.forzado(J.paso);
    if (obligado) {
      var laQueVa = todas.filter(function (k) {
        return Guion.destino(k, J.lugar) === obligado;
      });
      if (!laQueVa.length) {
        laQueVa = Guion.CARTAS.filter(function (c) {
          return c.figura === obligado;
        }).map(function (c) { return c.clave; });
        // Vuelve al mazo: se saco de ahi y jugar() la va a querer sacar.
        laQueVa.forEach(function (k) {
          if (J.mazo.indexOf(k) === -1) J.mazo.push(k);
        });
      }
      return laQueVa.slice(0, 1);
    }

    if (J.paso === 0) {
      var guardadas = todas.filter(function (k) {
        return NO_AL_ARRANQUE.indexOf(k) !== -1;
      });
      todas = todas.filter(function (k) {
        return NO_AL_ARRANQUE.indexOf(k) === -1;
      });
      // Si por lo que sea no quedaran suficientes, vuelven al final.
      if (todas.length < n) todas = todas.concat(guardadas);
    }
    // En el ultimo paso da igual: todas llevan al mismo lado.
    if (J.paso >= Guion.PASOS - 1) return todas.slice(0, n);

    /* Las del tramo primero. Sin esto, una carta del tramo del dolor podria
       salir entre los recuerdos y el arco se desarma. */
    var tramo = Guion.tramoDe(J.paso);
    var delTramo = [], deOtro = [];
    todas.forEach(function (k) {
      var d = Guion.destino(k, J.lugar);
      if (tramo && tramo.lugares && tramo.lugares.indexOf(d) !== -1) delTramo.push(k);
      else deOtro.push(k);
    });

    /* De donde se viene. Volver a un lugar ya visitado esta bien —en un sueno
       repetir es verosimil y hay texto propio para eso—, pero rebotar contra
       el lugar que se acaba de dejar no se lee como un sueno: se lee como que
       el juego te devolvio. Esas cartas van ultimas, y solo se reparten si no
       quedo ninguna otra. */
    var deDondeVengo = J.recorrido[J.recorrido.length - 2];

    function ordenar(lista) {
      var nuevas = [], repetidas = [], volver = [], inutiles = [];
      lista.forEach(function (k) {
        var d = Guion.destino(k, J.lugar);
        if (!d || d === J.lugar) inutiles.push(k);
        else if (d === deDondeVengo) volver.push(k);
        else if (J.visitados[d]) repetidas.push(k);
        else nuevas.push(k);
      });
      // Primero las que abren lugar nuevo; despues las repetidas; despues las
      // que hacen retroceder; las que no cambian nada, al final de todo.
      return nuevas.concat(repetidas).concat(volver).concat(inutiles);
    }

    var mano = ordenar(delTramo).concat(ordenar(deOtro));

    /* Y las de otro tramo se sacan, no solo se posponen. Ponerlas ultimas
       alcanzaba mientras hubiera tres del tramo para repartir, pero no siempre
       las hay: la carta que revela no tiene figura propia —su destino sale del
       lugar donde uno esta— y puede llevar a cualquier lado, incluida la ruina
       en pleno tramo de los recuerdos. Cuando eso pasa, el arco del sueno se
       desarma: se llega al dolor dos pasos antes de que la estructura lo
       traiga, y despues se vuelve porque el tramo lo fuerza igual. Vale mas
       una mano corta. */
    if (tramo && tramo.lugares) {
      var delTramoAqui = function (k) {
        var d = Guion.destino(k, J.lugar);
        return d && d !== J.lugar && tramo.lugares.indexOf(d) !== -1;
      };
      var soloTramo = mano.filter(delTramoAqui);
      /* Y si el mazo se quedo sin ninguna del tramo, se rescata: la estructura
         no puede depender de la suerte del reparto. Es lo mismo que hace el
         tramo forzado cuando su carta ya se jugo. */
      if (!soloTramo.length) {
        var rescate = mezclar(Guion.CARTAS.map(function (c) { return c.clave; })
          .filter(delTramoAqui));
        soloTramo = rescate.slice(0, 1);
        soloTramo.forEach(function (k) {
          if (J.mazo.indexOf(k) === -1) J.mazo.push(k);
        });
      }
      if (soloTramo.length) mano = soloTramo;
    }

    /* Y las que hacen retroceder se sacan del todo, no solo se posponen: con
       ponerlas ultimas seguian entrando en la mano una de cada sesenta, y una
       carta que te devuelve al lugar que acabas de dejar se lee como un error
       del juego aunque la hayas elegido vos. Vale mas una mano de dos cartas.
       Solo se usan si no quedara ninguna otra. */
    var sinRetroceso = mano.filter(function (k) {
      return Guion.destino(k, J.lugar) !== deDondeVengo;
    });
    if (sinRetroceso.length) mano = sinRetroceso;

    return mano.slice(0, Math.min(n, mano.length));
  }

  function empezar() {
    document.getElementById('portada').classList.add('ido');
    luego(1500, function () {
      J.recorrido.push(J.lugar);
      llegar(true);
    });
  }

  /* El cartel dice lo que se esta viendo, no en que paso va la partida.

     La figura pasa a ser la nueva apenas termina la transformacion, pero el
     nombre se ponia recien al avanzar de paso. Antes ese hueco duraba unos
     segundos; desde que el relato espera al jugador, dura lo que el tarde en
     leer — y en el medio la pantalla muestra un lugar con el nombre de otro. */
  function ponerRotulo(clave) {
    var l = Guion.lugar(clave);
    if (!l) return;
    if (elRotulo.textContent !== l.nombre) elRotulo.textContent = l.nombre;
    elRotulo.classList.add('ver');
  }

  /* Bel aparece en el lugar donde está. `primera` distingue el arranque del
     sueño de los pasos siguientes. */
  function llegar(primera) {
    var l = Guion.lugar(J.lugar);
    if (!l) return terminar();

    /* Llegar a un lugar cierra cualquier transformacion en curso. No es solo
       prolijidad: si la mutacion quedara a medias, el juego se traba para
       siempre porque nadie mas vuelve a poner J.u en 1. */
    J.u = 1;
    J.destino = null;
    J.pares = null;
    J.jugando = false;
    J.congelado = false;
    J.revelando = 0;
    mirada.activo = false;

    /* Bel se queda donde esta, siempre. La figura se transforma delante de
       ella; no cambia el lugar de plano.

       Antes, al empezar la partida se la mandaba fuera de cuadro para que
       entrara caminando desde la izquierda. Pero la portada ya la muestra
       parada en su sitio: al tocar ENTRAR se veia un instante nitida, despues
       desaparecia del todo y recien entonces volvia caminando. Se leia como un
       error, no como una entrada.

       La marca NO se fija aca. La calcula el bucle, que es el unico que sabe
       donde termino quedando la figura. Fijandola en los dos lados, llegar()
       ponia una y el cuadro siguiente la corregia: Bel caminaba hacia un punto,
       la marca se movia, y volvia — el ida y vuelta que se veia en cada carta. */

    ponerRotulo(J.lugar);
    elMarcador.classList.add('ver');
    actualizarRestan();
    Audio2.entrada();
    Audio2.colorDe(J.lugar);

    // Si ya estuvo acá, lo dice distinto: es un sueño, repetir es verosímil.
    var texto = (!primera && J.visitados[J.lugar]) ? l.vuelta : l.llegada;
    J.visitados[J.lugar] = true;

    decir(texto, mostrarMano);
  }

  var elResto = document.getElementById('resto');
  var elPila = document.getElementById('pila');
  var elCuantas2 = document.getElementById('cuantas2');

  /* Lo que queda del mazo, como una pilita. Sin esto no habia forma de saber
     que las cartas se gastan, que es de lo que trata elegir. */
  function pintarResto() {
    var n = J.mazo.length;
    var capas = Math.max(1, Math.min(5, Math.ceil(n / 3)));
    if (elPila.children.length !== capas) {
      elPila.innerHTML = '';
      for (var i = 0; i < capas; i++) {
        var c = document.createElement('i');
        c.style.transform = 'translate(' + (i * 1.6) + 'px,' + (-i * 1.6) + 'px)';
        c.style.opacity = (.45 + i * .13).toFixed(2);
        elPila.appendChild(c);
      }
    }
    elCuantas2.textContent = n + (n === 1 ? ' carta' : ' cartas');
    elResto.classList.toggle('ver', n > 0);
  }

  /* La pestana dice en que anda la partida: con varias abiertas todas decian
     lo mismo. */
  var TITULO = document.title;
  function actualizarTitulo() {
    var t = TITULO;
    if (J.paso > 0 && !elCierre.classList.contains('ver')) {
      t = TITULO + ' · ' + Math.min(J.paso + 1, Guion.PASOS) + '/' + Guion.PASOS +
          ' · ' + J.indicios.length + ' de ' + Guion.PASOS;
    }
    if (document.title !== t) document.title = t;
  }

  function actualizarRestan() {
    actualizarTitulo();
    elRestan.textContent = J.indicios.length + ' de ' + Guion.PASOS +
      '  ·  paso ' + Math.min(J.paso + 1, Guion.PASOS);
    // Una bolita por paso; se encienden las que encontro.
    if (elCuentas.children.length !== Guion.PASOS) {
      elCuentas.innerHTML = '';
      for (var i = 0; i < Guion.PASOS; i++) {
        var d = document.createElement('span');
        d.className = 'cuenta';
        elCuentas.appendChild(d);
      }
    }
    for (var k = 0; k < Guion.PASOS; k++) {
      elCuentas.children[k].classList.toggle('llena', k < J.indicios.length);
    }
    pintarResto();
  }

  /* Los naipes en pantalla, para poder repintarlos si cambia el tamano. */
  var naipes = [];
  /* Los dorsos del tramo sin eleccion: se repintan con los naipes. */
  var dorsos = [];

  /* Pinta cada lamina a la resolucion real de su hueco. Si se dibujara a un
     tamano fijo, en pantallas densas se veria borrosa. */
  function pintarNaipes() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    naipes.forEach(function (n) {
      var an = n.lienzo.clientWidth, al = n.lienzo.clientHeight;
      if (an < 2 || al < 2) { an = 126; al = 189; }
      // Repintar un naipe es caro; si el hueco no cambio, no hay nada que hacer.
      if (n.an === an && n.al === al) return;
      n.an = an; n.al = al;
      n.lienzo.width = an * d;
      n.lienzo.height = al * d;
      var c2 = n.lienzo.getContext('2d');
      c2.setTransform(d, 0, 0, d, 0, 0);
      Naipes.dibujar(c2, n.carta.clave, n.carta.num, n.carta.nombre, an, al,
                     n.carta.lectura, n.carta.astro);
    });
    dorsos.forEach(function (l) {
      var an = l.clientWidth, al = l.clientHeight;
      if (an < 2 || al < 2) { an = 126; al = 189; }
      if (l.__an === an && l.__al === al) return;
      l.__an = an; l.__al = al;
      l.width = an * d; l.height = al * d;
      var c3 = l.getContext('2d');
      c3.setTransform(d, 0, 0, d, 0, 0);
      Naipes.dorso(c3, an, al);
    });
  }
  window.addEventListener('resize', pintarNaipes);

  /* La guia de la primera partida.

     Cada aviso sale una sola vez en la vida de la partida y se va solo. No es
     un tutorial aparte: son tres frases sobre el juego andando, en el momento
     exacto en que hacen falta. Alguien que ya sabe jugar no las lee porque
     para cuando aparecen ya hizo la accion. */
  function guiar(clave, texto, duracion) {
    if (J.guias[clave]) return;
    J.guias[clave] = true;
    elGuia.textContent = texto;
    /* Si no hay cartas repartidas, la guia se va al pie. Con cartas tiene que
       quedar arriba de ellas o queda tapada. */
    elGuia.classList.toggle('abajo', !elMano.querySelector('.carta'));
    elGuia.classList.add('ver');
    luego(duracion || 4600, function () {
      // Solo se apaga si sigue siendo la suya: otra guia pudo tomar el cartel.
      if (elGuia.textContent === texto) elGuia.classList.remove('ver');
    });
  }

  function mostrarMano() {
    var claves = repartir(3);
    elMano.innerHTML = '';
    naipes = [];
    dorsos = [];
    elMano.classList.remove('fuera');
    medirMano();

    /* El tramo sin eleccion reparte una sola carta. Dibujarla sola se lee como
       que el reparto fallo, asi que se ocupan las tres posiciones: las dos de
       los costados quedan como siluetas vacias. Cuenta "aca no elegis" sin una
       palabra, que es la regla del tramo.

       Se quedan mientras dure la mano, no se deshacen: el texto del lugar
       espera a que toques, asi que se mira la mano bastante despues de que se
       reparte. Cuando se desvanecian al segundo, quien leia tranquilo llegaba
       tarde y volvia a ver una carta sola — que es justo lo que habia que
       evitar. */
    var sinEleccion = claves.length === 1 && !!Guion.forzado(J.paso);
    function sombra() {
      var s = document.createElement('div');
      s.className = 'sombra';
      s.setAttribute('aria-hidden', 'true');
      /* Un naipe dado vuelta, no un hueco. Dos rectangulos vacios se leen como
         cartas que no cargaron — paso de verdad al probarlo. Con el dorso del
         mazo se lee lo que es: hay cartas, pero no son para vos. */
      var lienzo = document.createElement('canvas');
      lienzo.className = 'lamina';
      s.appendChild(lienzo);
      elMano.appendChild(s);
      // Se pinta despues, con pintarNaipes: recien ahi el hueco tiene alto.
      dorsos.push(lienzo);
      luego(90, function () { s.classList.add('entra'); });
    }
    if (sinEleccion) sombra();

    claves.forEach(function (clave, i) {
      var c = Guion.carta(clave);
      var el = document.createElement('button');
      el.className = 'carta';
      el.style.setProperty('--giro', ((i - (claves.length - 1) / 2) * 5) + 'deg');
      /* El naipe se dibuja en su propio canvas: el numeral, la lamina del
         arcano y la cartela con el nombre. La lectura queda debajo, fuera de
         la carta, porque en una lamina de verdad no hay texto explicativo. */
      var lienzo = document.createElement('canvas');
      lienzo.className = 'lamina';
      el.appendChild(lienzo);
      naipes.push({ lienzo: lienzo, carta: c });
      el.addEventListener('click', function () { jugar(c, el); });
      el.addEventListener('mouseenter', function () { Audio2.roce(); });
      // En táctil no hay hover: el roce suena al tocar y la carta se juega ahí.
      el.addEventListener('touchstart', function (ev) {
        ev.preventDefault();
        Audio2.roce();
        jugar(c, el);
      }, { passive: false });
      elMano.appendChild(el);
      luego(90 + i * 130, function () { el.classList.add('entra'); });
    });
    if (sinEleccion) sombra();
    // Despues de insertarlas: recien ahi tienen tamano.
    pintarNaipes();
    medirMano();

    /* Lo primero que hay que entender del juego: la carta no es una opcion de
       diccionario, es lo que va a transformar lo que tenes delante. */
    if (J.paso === 0) {
      luego(1200, function () {
        guiar('mano', 'elegí un arcano · lo que juegues transforma lo que tenés delante', 6000);
      });
    }
  }

  function jugar(c, elCarta) {
    // Un doble click rapido llegaba a colarse entre el click y el repintado.
    if (J.jugando) return;
    if (J.u < 1) return;
    // Una carta gastada no se vuelve a jugar. La clase .fuera bloquea el mouse,
    // pero eso es CSS: esta es la guarda de verdad.
    if (J.mazo.indexOf(c.clave) === -1) return;

    J.jugando = true;
    /* La guia del reparto se va con la carta jugada. Duraba seis segundos por
       reloj propio, asi que seguia puesta cuando las piezas ya volaban — en el
       medio de la escena, encima de la figura y del anillo, tapando justo lo
       que el aviso te acaba de pedir que mires. */
    if (elGuia) elGuia.classList.remove('ver');
    J.mazo = J.mazo.filter(function (k) { return k !== c.clave; });
    J.jugadas.push(c.clave);
    J.paso++;

    /* A dónde lleva. En el último paso todo termina en la cama: es el
       despertar, y es la única vez que la cama puede aparecer. */
    var destino;
    if (J.paso >= Guion.PASOS) {
      destino = 'cama';
      Audio2.tensar(1);
    } else {
      destino = Guion.destino(c.clave, J.lugar);
      // Red de seguridad: nada que no sea el final puede llevar a la cama.
      if (!destino || destino === 'cama') destino = 'puerta';
    }

    J.pares = Figuras.preparar(J.lugar, destino);
    J.destino = { figura: destino, color: c.color };
    J.u = 0;
    J.fogonazo = 1;

    // La elegida sale hacia la figura; las otras dos caen.
    if (elCarta) elCarta.classList.add('elegida');
    elMano.classList.add('fuera');
    medirMano();
    elRelato.classList.remove('ver');
    actualizarRestan();

    Audio2.golpe(c.tono === 'sombra' ? 3 : 0);
    Audio2.transformar(c.tono);

    // Lo que pasa delante la alcanza.
    bel.empuje = c.tono === 'sombra' ? 1 : .62;
    bel.asombro = 1;

    // Mientras las piezas vuelan hay un momento para mirar lo que este lugar
    // escondía. Es la última oportunidad: en un instante deja de existir.
    J.esconde = Guion.lugar(J.lugar).esconde;
    J.vioAhora = null;
    /* El anillo arranca en 2.9 veces el radio: si el radio se calcula solo
       contra la pantalla, en vertical el anillo nace pisando el borde. Se
       ajusta al espacio que hay de verdad a cada lado del centro. */
    var ix = ejeFigura();
    var iy = J.ultimaFy || H * .44;
    var aire = Math.min(ix, W - ix) - 14;
    var iradio = Math.max(34, Math.min(Math.min(W, H) * .13, aire / 2.9));
    Instante.arrancar(mirada, ix, iy, iradio);
    /* El aviso dice que hacer, no una palabra suelta: "mira" no le indicaba
       a nadie que habia que quedarse mirando.

       La primera vez dice ademas que hay algo escondido, que es la mitad que
       falta. Antes eso lo decia una guia aparte encima de la escena, y pasaban
       las dos peores cosas a la vez: el mismo texto dos veces en pantalla, y
       el cartel justo encima de las piezas volando — tapando lo unico que hay
       que mirar en el momento en que hay que mirarlo. */
    var primeraMirada = !J.guias.anillo;
    J.guias.anillo = true;
    mostrarAviso(primeraMirada
      ? 'mientras se transforma, este lugar deja ver lo que esconde · mantené apretado'
      : 'mantené apretado para quedarte mirando', '');

    /* Como sigue el paso una vez que se dijo todo lo que habia que decir.
       Puede llamarlo el reloj —cuando no se encontro nada— o el indicio, si
       se encontro: por eso la guarda, para que no corra dos veces. */
    var yaSiguio = false;
    J.seguirPaso = function () {
      if (yaSiguio) return;
      yaSiguio = true;
      decir(c.accion, function () {
        // decir() ya espero lo que se tarda en leerlo; esto es el respiro.
        luego(1100, function () {
          /* Normalmente el bucle de dibujo ya lo movio, apenas termino la
             mutacion. Pero el bucle puede no correr — una pestana en segundo
             plano no recibe frames — y el estado del juego no puede depender
             de que se este dibujando. Asignar de nuevo es inocuo y garantiza
             que el paso avance igual. */
          J.lugar = destino;
          J.recorrido.push(destino);
          if (J.paso >= Guion.PASOS) terminar();
          else llegar(false);
        });
      });
    };

    /* El texto entra cuando la transformacion ya se ve — salvo que se haya
       encontrado algo, y entonces el indicio va primero y manda el.

       La guarda del paso es contra una carrera: si este reloj llega tarde,
       cuando el paso siguiente ya empezo, `J.seguirPaso` apunta al cierre del
       paso NUEVO. Llamarlo desde aca lo consume, y el paso nuevo se queda sin
       nadie que lo cierre — trabado con jugando=true para siempre. */
    var miPaso = J.paso;
    luego(2400, function () {
      if (J.paso !== miPaso) return;
      if (J.congelado || J.vioAhora) return;
      J.seguirPaso();
    });
  }

  function terminar() {
    elRotulo.classList.remove('ver');
    elRelato.classList.remove('ver');
    elMarcador.classList.remove('ver');
    elMano.classList.add('fuera');
    medirMano();
    ocultarAviso();

    var f = Guion.final(J.indicios, J.recorrido);
    elCierre.innerHTML = '';
    f.partes.forEach(function (p) {
      var el = document.createElement('p');
      el.textContent = p;
      elCierre.appendChild(el);
    });
    /* Lo que llego a ver, escrito. El cierre hablaba de "lo que viste" sin
       mostrarlo nunca, asi que no habia forma de saber que se habia perdido. */
    var caja = document.createElement('div');
    caja.className = 'hallazgos';
    var titu = document.createElement('p');
    titu.className = 'titu';
    titu.textContent = 'Viste ' + J.indicios.length + ' de ' + Guion.PASOS;
    caja.appendChild(titu);
    if (J.indicios.length) {
      var ul = document.createElement('ul');
      J.indicios.forEach(function (ind) {
        var li = document.createElement('li');
        // Solo la primera oracion: el listado es un recordatorio, no el texto.
        li.textContent = ind.split('. ')[0] + '.';
        ul.appendChild(li);
      });
      caja.appendChild(ul);
    } else {
      var nada = document.createElement('p');
      nada.className = 'nada';
      nada.textContent = 'Nada. Ocho veces algo estuvo a punto de mostrarse.';
      caja.appendChild(nada);
    }
    /* Y lo que se perdio, contado pero no revelado: saber que habia algo es
       parte de lo que el juego quiere dejar. */
    if (J.perdidos.length) {
      var pp = document.createElement('p');
      pp.className = 'perdido';
      pp.textContent = J.perdidos.length === 1
        ? 'Otro lugar escondía algo y no llegaste a verlo.'
        : 'Otros ' + J.perdidos.length + ' lugares escondían algo y no llegaste a verlo.';
      caja.appendChild(pp);
    }
    elCierre.appendChild(caja);

    var firma = document.createElement('p');
    firma.className = 'firma';
    firma.textContent = 'para Bel';
    elCierre.appendChild(firma);

    var seguir = document.createElement('button');
    seguir.className = 'boton';
    seguir.textContent = 'Hay una carta más';
    seguir.addEventListener('click', function () {
      elCierre.classList.remove('ver');
      luego(900, mostrarCartaFinal);
    });
    elCierre.appendChild(seguir);
    habilitarLuego(seguir, 2600);

    Audio2.final();
    Audio2.dormirColchon(5);
    luego(1200, function () { elCierre.classList.add('ver'); });
  }

  /* La carta que es de ella. No se reparte: se da vuelta una sola vez, al
     final, y es lo unico del juego que le habla a Bel y no a quien juega. */
  function mostrarCartaFinal() {
    var f = Guion.cartaDeElla(J.indicios);
    var caja = document.getElementById('final');
    var frente = document.getElementById('finalFrente');
    var dorso = document.getElementById('finalDorso');

    var d = Math.min(2, window.devicePixelRatio || 1);
    function medirLienzo(el) {
      var an = el.clientWidth || 230, al = el.clientHeight || 345;
      el.width = an * d; el.height = al * d;
      var c2 = el.getContext('2d');
      c2.setTransform(d, 0, 0, d, 0, 0);
      return { c2: c2, an: an, al: al };
    }

    var texto = document.getElementById('finalTexto');
    texto.innerHTML = '';
    var quien = document.createElement('p');
    quien.className = 'paraquien';
    quien.textContent = 'Arcano XXII · para Bel';
    texto.appendChild(quien);
    f.parrafos.forEach(function (p, i) {
      var el = document.createElement('p');
      if (i === f.parrafos.length - 1) el.className = 'cierraTodo';
      el.textContent = p;
      texto.appendChild(el);
    });

    caja.classList.add('ver');
    // Pintar despues de que la caja tenga tamano.
    luego(60, function () {
      var A = medirLienzo(frente), B = medirLienzo(dorso);
      Naipes.dibujar(A.c2, f.clave, f.num, f.nombre, A.an, A.al, f.lectura, f.astro);
      Naipes.dorso(B.c2, B.an, B.al);
      // Y recien ahi darla vuelta.
      luego(700, function () {
        caja.classList.add('dada');
        // Recien cuando termino de darse vuelta aparece la salida.
        luego(2400, function () {
          if (document.getElementById('haciaSobre')) return;
          var seguir = document.createElement('button');
          seguir.className = 'boton';
          seguir.id = 'haciaSobre';
          seguir.textContent = 'Y una carta de verdad';
          seguir.addEventListener('click', function () {
            caja.classList.remove('ver');
            luego(1100, mostrarSobre);
          });
          texto.appendChild(seguir);
          habilitarLuego(seguir, 1400);
        });
        Audio2.gota(0, 1, .11, 4.2);
        luego(500, function () { Audio2.gota(4, 1, .08, 3.8); });
        luego(1100, function () { Audio2.gota(7, 2, .06, 3.4); });
      });
    });
  }

  /* El sobre. Aparece despues del arcano y es lo unico del juego que no
     pertenece al sueno: es una carta de papel, de Nico para Bel. */
  var btnAbrir = document.getElementById('abrirSobre');

  function mostrarSobre() {
    var caja = document.getElementById('sobre');
    caja.classList.add('ver');
    if (btnAbrir) habilitarLuego(btnAbrir, 1400);
    Audio2.gota(0, 0, .09, 5);
    luego(700, function () { Audio2.gota(4, 1, .06, 4.4); });
  }

  function abrirCarta() {
    var elSobre = document.getElementById('sobre');
    var elCarta = document.getElementById('cartaEscrita');
    var hoja = document.getElementById('hoja');
    if (!hoja.children.length) {
      var c = Guion.CARTA_PARA_BEL;
      c.parrafos.forEach(function (t2) {
        var p2 = document.createElement('p');
        p2.textContent = t2;
        hoja.appendChild(p2);
      });
      var f = document.createElement('p');
      f.className = 'firma';
      f.textContent = c.firma;
      hoja.appendChild(f);
    }
    elSobre.classList.remove('ver');
    Audio2.volteo();
    luego(900, function () {
      elCarta.classList.add('ver');
      elCarta.scrollTop = 0;
    });
  }

  if (btnAbrir) btnAbrir.addEventListener('click', abrirCarta);
  var btnCerrar = document.getElementById('cerrarCarta');
  if (btnCerrar) btnCerrar.addEventListener('click', function () { location.reload(); });

  /* El sonido no puede tumbar el juego.
     Audio2 vive del AudioContext, que falla por motivos que no dependen de
     nadie: la pestana sin gesto previo, el contexto suspendido, un dispositivo
     que desaparece. Cualquiera de esas excepciones, subiendo por el medio de
     una jugada, cortaba el paso a la mitad. Envuelto, el juego sigue mudo pero
     entero. */
  (function () {
    if (typeof Audio2 !== 'object' || !Audio2) return;
    Object.keys(Audio2).forEach(function (k) {
      if (typeof Audio2[k] !== 'function') return;
      var original = Audio2[k];
      Audio2[k] = function () {
        try { return original.apply(Audio2, arguments); }
        catch (e) { if (window.console) console.warn('audio ' + k + ':', e); }
      };
    });
  })();

  /* ---------- el instante ---------- */

  function mostrarAviso(texto, clase) {
    if (!elAviso) return;
    elAviso.textContent = texto;
    elAviso.className = clase + ' ver';
  }
  function ocultarAviso() {
    if (elAviso) elAviso.className = '';
  }

  /* La chispa.

     Antes, acertar mostraba un cartel que decia "lo viste". Era una caja de
     texto en el medio de la pantalla, hablandole al jugador —no a ella— justo
     en el momento en que hay algo dibujado para mirar. Ahora no dice nada: de
     lo que acaba de aparecer sale una luz y se va hasta el marcador, y recien
     cuando llega se enciende la bolita. Se entiende sin una palabra y ademas
     dice DONDE queda anotado, que es lo que la guia explicaba con texto. */
  var chispas = [];

  function lanzarChispa(alLlegar) {
    var r = elMarcador.getBoundingClientRect();
    chispas.push({
      x0: ejeFigura(), y0: J.ultimaFy || (cv.height / (window.devicePixelRatio || 1)) * .45,
      x1: r.left + r.width * .5, y1: r.top + r.height * .5,
      t: 0, dur: 1.05, alLlegar: alLlegar
    });
  }

  /* El color de la chispa cambia en el camino: sale del color del anillo y
     llega con el del marcador. La luz se lleva el color de lo que viste y
     aterriza con el color de donde queda anotado. El tono de salida se lee de
     `Instante.tinta()`, asi que si el anillo cambia de color la chispa lo
     sigue sola. */
  var ORO_MARCADOR = [255, 226, 150];
  function colorChispa(u, aclarar) {
    var d = (Instante.tinta().lleno || '255,240,200').split(',');
    var e = u * u * (3 - 2 * u);
    var c = [];
    for (var k = 0; k < 3; k++) {
      var v = parseFloat(d[k]) + (ORO_MARCADOR[k] - parseFloat(d[k])) * e;
      if (aclarar) v += (255 - v) * aclarar;
      c.push(Math.round(v));
    }
    return c.join(',');
  }

  function dibujarChispas(cx, dt, W, H) {
    if (!chispas.length) return;
    for (var i = chispas.length - 1; i >= 0; i--) {
      var c = chispas[i];
      c.t += dt;
      var u = Math.min(1, c.t / c.dur);
      // Arranca despacio y llega frenando: una luz que sale, no un proyectil.
      var e = u * u * (3 - 2 * u);
      var x = c.x0 + (c.x1 - c.x0) * e;
      /* La panza. En linea recta se lee como una flecha de interfaz; con la
         curva se lee como algo que se eleva y despues se guarda. */
      var y = c.y0 + (c.y1 - c.y0) * e - Math.sin(u * Math.PI) * H * .11;
      var vida = Math.sin(Math.min(1, u * 1.15) * Math.PI * .92);

      cx.save();
      // La estela: la misma curva unos pasos atras, cada vez mas tenue.
      for (var k = 6; k >= 1; k--) {
        var uk = Math.max(0, u - k * .035);
        var ek = uk * uk * (3 - 2 * uk);
        var xk = c.x0 + (c.x1 - c.x0) * ek;
        var yk = c.y0 + (c.y1 - c.y0) * ek - Math.sin(uk * Math.PI) * H * .11;
        var ak = vida * (1 - k / 7) * .30;
        var ck = colorChispa(uk);
        var g = cx.createRadialGradient(xk, yk, 0, xk, yk, Math.max(1, H * .012));
        g.addColorStop(0, 'rgba(' + ck + ',' + ak.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + ck + ',0)');
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(xk, yk, H * .012, 0, 6.2832); cx.fill();
      }
      // Y la luz: halo ancho y un nucleo chico y blanco.
      var col = colorChispa(u);
      var gh = cx.createRadialGradient(x, y, 0, x, y, Math.max(1, H * .042));
      gh.addColorStop(0, 'rgba(' + col + ',' + (.55 * vida).toFixed(3) + ')');
      gh.addColorStop(1, 'rgba(' + col + ',0)');
      cx.fillStyle = gh;
      cx.beginPath(); cx.arc(x, y, H * .042, 0, 6.2832); cx.fill();
      // El nucleo, del mismo color pero casi blanco: es lo que le da el brillo.
      cx.fillStyle = 'rgba(' + colorChispa(u, .82) + ',' + (.95 * vida).toFixed(3) + ')';
      cx.beginPath(); cx.arc(x, y, Math.max(1.5, H * .0075), 0, 6.2832); cx.fill();
      cx.restore();

      if (u >= 1) {
        if (c.alLlegar) c.alLlegar();
        chispas.splice(i, 1);
      }
    }
  }

  function resolverMirada() {
    if (Instante.vio(mirada)) {
      // Lo que vio es el indicio de ESE lugar, y no se junta dos veces.
      if (J.esconde && J.indicios.indexOf(J.esconde) === -1) {
        J.indicios.push(J.esconde);
        J.vioAhora = J.esconde;
        J.tension = Math.min(1, J.indicios.length / (Guion.PASOS - 1));
        Audio2.tensar(J.tension);
        var iP = J.perdidos.indexOf(J.esconde);
        if (iP !== -1) J.perdidos.splice(iP, 1);
        /* El marcador se mueve cuando LLEGA la chispa, no cuando se acierta:
           si late antes, la luz llega a algo que ya paso y el viaje no cuenta
           nada. */
        lanzarChispa(function () {
          elMarcador.classList.remove('suma');
          void elMarcador.offsetWidth;
          elMarcador.classList.add('suma');
          actualizarRestan();
        });
      }
      /* Y se apaga el aviso que pedia mantener apretado. Antes lo tapaba el
         cartel de "lo viste"; sin ese cartel, la instruccion quedaba puesta
         despues de haberla cumplido. */
      ocultarAviso();
      Audio2.acierto();

      /* En el faro, y solo en el faro, ella abre los ojos y sonrie apenas.

         En todos los otros lugares cierra los ojos cuando el jugador toca:
         lo que ve no esta afuera. Este es el unico donde si lo esta — hay
         alguien arriba, en la linterna, y esa persona la esta mirando. Por eso
         la excepcion es el gesto: no hace falta explicar nada, es el unico
         momento del sueno en que ella mira para afuera.

         La sonrisa es chiquita a proposito y casi no se ve a esta escala
         —nueve pixeles de setecientos mil— pero esta, y quien se acerque a la
         pantalla la va a encontrar. Agrandarla la volveria una mueca. */
      if (J.lugar === 'faro') {
        bel.adentro = 0;
        bel.sonrisa = 1;
      }

      /* El mundo se frena y se dice lo que este lugar escondia, con la figura
         vieja todavia delante. */
      if (J.vioAhora) {
        var visto = J.vioAhora;
        J.congelado = true;
        decir(visto, function () {
          J.congelado = false;
          J.vioAhora = null;
          luego(1300, function () { if (J.seguirPaso) J.seguirPaso(); });
        });
      }
      luego(1400, function () {
        /* Ya no hace falta decir donde queda anotado: la chispa se va hasta el
           marcador a la vista de todos. Queda solo lo que el dibujo no puede
           contar. */
        guiar('marcador', 'cuántas veas decide el final', 5200);
      });

    } else {
      /* Siguio de largo, que no es un error: mirar es una decision, asi que
         no mirar tambien lo es y el juego no tiene nada que reprochar. Las
         primeras dos veces deja constancia de que ahi habia algo, para que se
         entienda que se podia. Despues se calla y no vuelve a mencionarlo:
         quien elige seguir de largo no necesita que se lo recuerden. */
      if (J.esconde && J.indicios.indexOf(J.esconde) === -1 &&
          J.perdidos.indexOf(J.esconde) === -1) {
        J.perdidos.push(J.esconde);
      }
      /* Un solo cartel, igual que al acertar. Antes eran dos: el aviso de que
         ahi habia algo y, un segundo y medio despues, una guia encima de la
         escena que explicaba como se hace. La primera vez el aviso dice las dos
         cosas juntas; la segunda, solo que habia algo; despues se calla. */
      J.siguioDeLargo = (J.siguioDeLargo || 0) + 1;
      if (J.siguioDeLargo === 1) {
        mostrarAviso('acá había algo · se ve manteniendo apretado', '');
      } else if (J.siguioDeLargo === 2) {
        mostrarAviso('acá había algo', '');
      }
    }
    actualizarRestan();
    luego(2600, ocultarAviso);
  }

  /* Con cualquier pantalla de cierre abierta no hay nada que mirar. */
  function algunaCapaAbierta() {
    return ['final', 'sobre', 'cartaEscrita'].some(function (id) {
      var el = document.getElementById(id);
      return el && el.classList.contains('ver');
    });
  }

  /* Apoyar para mirar. Devuelve si el gesto se consumio: el mismo dedo sirve
     para quedarse mirando y para seguir el relato, y hace falta saber cual de
     las dos cosas esta pasando. */
  function tocarInstante() {
    return Instante.apoyar(mirada);
  }

  /* Y soltar deja de mirar. Lo que se llevaba mirado no se pierde de golpe:
     baja despacio, asi que soltar sin querer y volver a apoyar suma igual. */
  function soltarInstante() {
    Instante.soltar(mirada);
  }
  window.addEventListener('pointerup', soltarInstante);
  window.addEventListener('pointercancel', soltarInstante);
  window.addEventListener('blur', soltarInstante);
  window.addEventListener('keyup', function (ev) {
    if (ev.code === 'Space' || ev.code === 'Enter') soltarInstante();
  });
  window.addEventListener('pointerdown', function (ev) {
    /* Las cartas y los botones tienen lo suyo: acá solo el resto de la
       pantalla. El target no siempre es un elemento — puede ser el propio
       window o el document — y ahí closest no existe. */
    var el = ev.target;
    if (el && typeof el.closest === 'function' &&
        el.closest('.carta,.boton,.sonido')) return;
    // Con el cierre o la carta final en pantalla no hay nada que mirar.
    if (elCierre.classList.contains('ver')) return;
    if (algunaCapaAbierta()) return;
    if (!tocarInstante()) avanzar();
  });
  window.addEventListener('keydown', function (ev) {
    if (ev.code !== 'Space' && ev.code !== 'Enter' &&
        ev.code !== 'ArrowRight' && ev.code !== 'KeyN') return;
    /* Con el foco en una carta o un boton, Enter y la barra le pertenecen a ese
       control: robarselos rompe la navegacion por teclado. */
    var f = document.activeElement;
    if (f && f !== document.body && typeof f.closest === 'function' &&
        f.closest('.carta,.boton,.sonido')) return;
    if (elCierre.classList.contains('ver')) return;
    if (algunaCapaAbierta()) return;
    ev.preventDefault();
    if (!tocarInstante()) avanzar();
  });

  /* ---------- dibujo ---------- */

  var anterior = performance.now();
  var sinBucle = false;

  var cuadrosDibujados = 0;

  function dibujarCuadro(ahora, deRespaldo) {
    cuadrosDibujados++;
    /* dt nunca puede ser negativo. El respaldo por reloj y el adelanto de
       cuadros de las pruebas mueven `anterior` mas alla del tiempo real, y
       cuando despues entra un cuadro normal la resta da negativa. Con dt
       negativo, las interpolaciones del tipo v += (objetivo - v) * (1 -
       pow(k, dt)) invierten el signo del factor y en vez de acercarse al
       objetivo se alejan: asi es como la cabeza de Bel se ponia a girar
       sola, cada vez mas, sin nada que la frenara. */
    /* Si el reloj interno quedo adelantado respecto del real, se resincroniza
       en vez de quedarse esperando. El adelanto de cuadros de las pruebas
       empuja `anterior` al futuro —cuatro segundos en una partida, minutos en
       varias— y con dt acotado a cero por abajo el juego quedaba paralizado
       hasta que el tiempo real lo alcanzara. Acotar el dt evitaba que la
       cabeza girara; sin esto, evitaba tambien que el juego avanzara. */
    if (ahora < anterior - 40) anterior = ahora;
    var dt = sinBucle ? 0 : Math.max(0, Math.min(.05, (ahora - anterior) / 1000));
    anterior = ahora; t += dt;

    // Si la ventana cambio de tamano, reajustar antes de dibujar nada.
    if (!sinBucle && revisarTamanio()) pintarNaipes();

    /* En los dos primeros lugares no hay naves. Lo raro de ahi tiene que
       poder explicarse: una montania rusa que sigue en pie, una calesita
       andando sola. Una nave cruzando el cielo en el primer paso adelanta el
       final del juego, que es justamente lo que nadie tiene que sospechar
       hasta la ultima pantalla. */
    Cielo.actualizar(cielo, dt, J.paso < 2);

    /* Camina hasta su marca en la direccion que sea: al cambiar la figura la
       marca se corre, y Bel se acomoda unos pasos en vez de saltar. */
    var falta = J.belMeta - J.belX;
    if (Math.abs(falta) > .004) {
      var paso2 = Math.min(Math.abs(falta), dt * .13);
      J.belX += paso2 * (falta > 0 ? 1 : -1);
      J.andando = true;
      bel.vx = falta > 0 ? 60 : -60;
    } else {
      J.andando = false;
      bel.vx = 0;
    }

    /* Mientras se lee lo que el lugar escondia, la transformacion se queda
       quieta: el indicio es de la figura que TODAVIA esta ahi, y si el mundo
       sigue mutando mientras se lee, el texto termina hablando de un lugar
       que ya no esta en pantalla. */
    /* Con el mundo frenado, la figura vuelve a armarse.

       Congelar el vuelo a mitad de camino dejaba las piezas desparramadas en
       el aire, y eso no se lee como un momento suspendido: se lee como que el
       juego se colgo. Ademas el texto habla del lugar que se esta yendo, asi
       que lo que tiene que estar en pantalla es ese lugar, entero.

       Al soltar, la transformacion arranca de nuevo desde el principio y se ve
       completa. */
    if (J.congelado && J.u > 0) {
      J.u = Math.max(0, J.u - dt * 1.7 * RITMO);
    }

    /* Lo que el lugar escondia, apareciendo. Sube mientras el mundo esta
       frenado y baja al soltarlo: la anomalia dura exactamente lo que dura la
       lectura, que es cuando se la puede mirar. */
    /* La cama se revela sola. Es el unico lugar donde no se juega ninguna
       carta —es el final del recorrido—, asi que ahi no hay instante que
       acertar y su anomalia no se disparaba nunca: se llegaba al cierre con
       la cama vacia, cuando el texto dice "estoy yo adentro, durmiendo". Y es
       justo la revelacion que explica el sueno entero, no un secreto opcional.
       Sube mas despacio que las otras: tiene que sentirse que uno se da
       cuenta, no que aparece. */
    if (J.lugar === 'cama' && J.u >= 1) {
      J.revelando = Math.min(1, J.revelando + dt * .55);
    } else if (J.congelado) J.revelando = Math.min(1, J.revelando + dt * 2.2);
    else if (J.revelando > 0) J.revelando = Math.max(0, J.revelando - dt * 1.4);

    if (J.u < 1 && !J.congelado) {
      /* La mutacion tarda ~3,6s en vez de ~2,4s. La ventana para mirar va de
         u .10 a .96, o sea 3,1s, y hay que sostener 1s: antes quedaba 1s para
         darse cuenta de que aparecio el anillo y reaccionar, que para alguien
         que no juega videojuegos es nada. Se alarga la mutacion y no se toca
         el segundo, que es de lo que se trata el juego. */
      J.u = Math.min(1, J.u + dt * .28 * RITMO);
      if (J.u >= 1 && J.destino) {
        J.destello = 1;
        /* Apenas termina la mutacion, el lugar pasa a ser el destino. Antes
           esto esperaba al callback que avanza de paso — cinco segundos mas
           tarde — y en el medio se volvia a dibujar la figura vieja: se veia
           luna, faro, luna otra vez, y recien despues faro. */
        J.lugar = J.destino.figura;
        J.color = J.destino.color;
        J.destino = null;
        // El cartel viaja con la figura, no con el paso.
        ponerRotulo(J.lugar);
      }
    }
    if (J.fogonazo > 0) J.fogonazo = Math.max(0, J.fogonazo - dt * .5 * RITMO);
    if (J.destello > 0) J.destello = Math.max(0, J.destello - dt * 1.5 * RITMO);

    // La tension llega despacio: un salto seco se leeria como un parpadeo.
    J.tensionSuave += (J.tension - J.tensionSuave) * (1 - Math.pow(.35, dt));
    // Y el ultimo paso tiene su propia cuenta, que sube sola.
    if (J.paso >= Guion.PASOS) J.climax = Math.min(1, J.climax + dt * .30);

    // El instante corre con la mutación, no con su propio reloj.
    var antesResuelto = mirada.resuelto;
    Instante.actualizar(mirada, J.u, dt * RITMO);
    if (!antesResuelto && mirada.resuelto) resolverMirada();

    /* El tic del anillo: cuatro golpes que se aceleran y se agudizan al
       acercarse a la marca. Es lo que permite acertar sin mirar la pantalla. */
    if (mirada.activo && !mirada.resuelto && !sinBucle) {
      var av = Instante.avanceVisible(mirada);
      var paso = Math.floor(av * 4);
      if (paso !== J.ultimoTic && paso >= 0 && paso <= 4) {
        J.ultimoTic = paso;
        Audio2.tic(av);
      }
    } else if (!mirada.activo) {
      J.ultimoTic = -1;
    }

    /* En el ultimo paso la camara se acerca. Es lo unico del juego que rompe el
       encuadre fijo, y por eso se siente que llego el final. */
    var acerca = 1 + J.climax * .12;
    if (J.climax > 0) {
      cx.save();
      cx.translate(W / 2, H * .46);
      cx.scale(acerca, acerca);
      cx.translate(-W / 2, -H * .46);
    }

    // --- cielo ---
    /* El cielo se va cargando: arranca casi negro y termina con el violeta
       subido, como si el lugar entero estuviera despierto. */
    var q3 = J.tensionSuave, cl = J.climax;
    var g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgb(' + Math.round(7 + q3 * 9 + cl * 6) + ',' +
                              Math.round(8 + q3 * 4) + ',' +
                              Math.round(25 + q3 * 20 + cl * 14) + ')');
    g.addColorStop(.55, 'rgb(' + Math.round(13 + q3 * 14 + cl * 8) + ',' +
                                Math.round(13 + q3 * 6) + ',' +
                                Math.round(34 + q3 * 28 + cl * 18) + ')');
    g.addColorStop(1, 'rgb(' + Math.round(23 + q3 * 22 + cl * 14) + ',' +
                              Math.round(17 + q3 * 8) + ',' +
                              Math.round(48 + q3 * 34 + cl * 22) + ')');
    cx.fillStyle = g;
    cx.fillRect(0, 0, W, H);
    Cielo.dibujar(cx, cielo, W, H, t);
    /* La luna del hilo: su fase es lo que la jugadora lleva encontrado. Se
       apaga cuando el lugar del recorrido ES la luna, porque dos lunas en el
       mismo cuadro se leen como un error de dibujo y no como una idea. */
    var enLaLuna = (J.lugar === 'luna') || (J.destino && J.destino.figura === 'luna');
    Cielo.luna(cx, W, H, t, faseLuna(), !enLaLuna,
               lunaReal ? lunaReal.signoGlifo : null);

    /* En vertical la pantalla es angosta y alta: si el piso se queda abajo del
       todo, queda un tercio de escena y dos tercios de cielo vacío. */
    /* Donde cae la linea del suelo.

       No sale de un porcentaje fijo ni de umbrales de aspecto: sale de donde
       estan las cartas de verdad. Con un porcentaje, en cuanto la pantalla es
       ancha y baja la escena y la mano se pelean el mismo espacio y las cartas
       terminan tapando un tercio de la figura — y cualquier umbral que uno
       elija deja casos afuera. Midiendo la mano, la escena siempre vive arriba
       de ella y las cartas ocupan la franja del suelo, que es donde tiene
       sentido que esten: apoyadas adelante. */
    var vertical = H > W * 1.25;
    var piso = Math.min(H * (vertical ? .80 : .84), techoMano() + H * .05);

    // --- resplandor de la carta jugada ---
    if (J.fogonazo > 0) {
      var q = J.fogonazo;
      var col = J.destino ? J.destino.color : J.color;
      var r = cx.createRadialGradient(ejeFigura(), H * .44, 0, ejeFigura(), H * .44, H * .72);
      r.addColorStop(0, 'rgba(' + col + ',' + (.17 * q) + ')');
      r.addColorStop(1, 'rgba(' + col + ',0)');
      cx.fillStyle = r;
      cx.fillRect(0, 0, W, H);
    }

    // --- la figura, en tres capas ---
    var fx = ejeFigura();
    /* El tamaño no sale solo de la pantalla: sale del hueco que queda entre el
       texto y el piso. Midiendo contra la altura total, una pantalla ancha y
       baja hace crecer la figura hasta meterse atras del relato — que es
       exactamente lo que pasaba. Una figura terrestre ocupa 2E de alto, asi
       que E no puede pasar de la mitad de ese hueco. */
    var techoEscena = H * (vertical ? .27 : .29);
    var cabe = (piso - techoEscena) / 2;
    /* El minimo no es cosmetico: si la mano se mide antes de que el layout
       asiente, el hueco da negativo, E se va abajo de cero y el primer
       createRadialGradient tira IndexSizeError y no se dibuja nada. */
    var E = Math.max(W * .08, Math.min(vertical ? W * .30 : W * .27, cabe));
    var fy = alturaDe(J.lugar, J.destino, J.u, piso, E);
    /* La calesita se despega del piso mientras la mirás, y apoya cuando
       soltás. Va acá y no en la anomalía porque hay que MOVER la figura: las
       anomalías dibujan encima y no la tocan.

       No hace falta pedir que no haya destino. Cuando el instante se resuelve,
       la transformación REBOBINA —medido: u va de 0,39 a 0,06 en dos décimas—
       justo para que la figura vieja vuelva a estar entera mientras se muestra
       lo que escondía. Pedir `!J.destino` era pedir el único caso que nunca
       ocurre: durante la revelación siempre hay uno. */
    if (J.lugar === 'calesita' && J.revelando > 0) {
      fy -= E * .17 * Math.min(1, J.revelando * 1.6);
    }
    /* Las figuras se mueven mas rapido cuanto mas descubierto esta el sueno.
       No es un efecto encima: es la misma animacion, acelerada, y por eso se
       lee como que el lugar se puso nervioso y no como un filtro. */
    var tt = t * (1 + J.tensionSuave * .85 + J.climax * .6);
    var extra = { perfil: Figuras.perfilMontania(), alPiso: piso - fy,
                  tension: J.tensionSuave };
    var u = J.u;

    // Halo propio: cada figura tine el aire que la rodea con su color.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    var gh = cx.createRadialGradient(fx, fy, E * .2, fx, fy, E * (1.9 + J.tensionSuave * .5));
    gh.addColorStop(0, 'rgba(' + J.color + ',' + (.055 + J.tensionSuave * .075 + J.climax * .06).toFixed(3) + ')');
    gh.addColorStop(1, 'rgba(' + J.color + ',0)');
    cx.fillStyle = gh;
    cx.beginPath(); cx.arc(fx, fy, E * 1.9, 0, 6.2832); cx.fill();
    cx.restore();

    if (u >= 1) {
      Pintores.pintar(cx, J.lugar, fx, fy, E, tt, extra);
      /* Y encima, lo que este lugar escondia. Va despues de la figura y nunca
         la borra: se agrega, como algo que estaba ahi y recien ahora se ve. */
      if (J.revelando > 0 && typeof Anomalias !== 'undefined') {
        Anomalias.pintar(cx, J.lugar, fx, fy, E, t, J.revelando, extra,
                         W, H, W * J.belX, piso);
      }
    } else {
      var aSale = 1 - Math.min(1, u / .26);
      var aEntra = Math.max(0, (u - .70) / .30);
      var aPiezas = Math.min(1, Math.min(u / .16, (1 - u) / .18));
      /* Mientras se muestra lo que el lugar escondia, el mundo se frena y
         queda SOLO la figura vieja: sostener un segundo se come media
         mutacion, asi que para cuando se resuelve el instante la figura
         nueva ya esta entrando, y encima de un arbol aparecian dos naves a
         medio armar. Se apagan las dos mientras dura la revelacion. */
      var quieto = 1 - Math.min(1, J.revelando);
      aPiezas *= quieto;
      aEntra *= quieto;

      if (aSale > .01) {
        cx.save(); cx.globalAlpha = aSale;
        Pintores.pintar(cx, J.lugar, fx, fy, E, tt, extra);
        cx.restore();
        /* Y lo que este lugar escondia, encima de la figura que se va.
           Es ACA donde se ve: el instante se resuelve mientras la figura se
           transforma, o sea con u < 1, y la rama de figura quieta nunca llega
           a correr con revelando en alto. Sin esto, acertar sumaba el indicio
           al marcador y decia el texto, pero no se dibujaba nada: se leia
           "pero yo lo vi" con el lugar intacto y vacio. */
        if (J.revelando > 0 && typeof Anomalias !== 'undefined') {
          cx.save(); cx.globalAlpha = aSale;
          Anomalias.pintar(cx, J.lugar, fx, fy, E, t, J.revelando, extra,
                           W, H, W * J.belX, piso);
          cx.restore();
        }
      }
      if (aPiezas > .01 && J.pares) {
        var cc = J.destino ? mezclarColor(J.color, J.destino.color, u) : J.color;
        cx.save(); cx.globalAlpha = aPiezas;
        Figuras.dibujar(cx, J.pares, u, fx, fy, E, cc, t);
        cx.restore();
      }
      if (aEntra > .01 && J.destino) {
        cx.save(); cx.globalAlpha = aEntra;
        Pintores.pintar(cx, J.destino.figura, fx, fy, E, tt, extra);
        cx.restore();
      }
    }

    // Golpe de luz en el momento en que la cosa nueva termina de aparecer.
    if (J.destello > 0) {
      var q2 = J.destello * J.destello;
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      var gd = cx.createRadialGradient(fx, fy, 0, fx, fy, E * 2.4);
      gd.addColorStop(0, 'rgba(255,250,235,' + (.26 * q2) + ')');
      gd.addColorStop(.45, 'rgba(' + J.color + ',' + (.14 * q2) + ')');
      gd.addColorStop(1, 'rgba(255,250,235,0)');
      cx.fillStyle = gd;
      cx.beginPath(); cx.arc(fx, fy, E * 2.4, 0, 6.2832); cx.fill();
      cx.restore();
    }

    // El instante va sobre la figura: es lo que hay que mirar.
    J.ultimaFy = fy;
    Instante.dibujar(cx, mirada, t);

    // --- suelo ---
    /* El suelo no arranca con un color propio: arranca transparente y se va
       oscureciendo. Con un color opaco el brillo saltaba de golpe en la linea
       del horizonte y el cuadro se partia en dos mitades. */
    var s = cx.createLinearGradient(0, piso, 0, H);
    s.addColorStop(0, 'rgba(7,5,16,0)');
    s.addColorStop(.22, 'rgba(7,5,16,.34)');
    s.addColorStop(.60, 'rgba(6,4,14,.72)');
    s.addColorStop(1, 'rgba(4,3,11,.92)');
    cx.fillStyle = s;
    cx.fillRect(0, piso, W, H - piso);

    /* El reflejo de la figura sobre el piso: la misma figura espejada, muy
       tenue y desdibujada. Es lo que hace que el suelo deje de ser una franja
       negra y pase a ser un lugar. */
    if (u >= 1) {
      cx.save();
      cx.beginPath(); cx.rect(0, piso, W, H - piso); cx.clip();
      cx.globalAlpha = .10;
      cx.translate(0, piso * 2);
      cx.scale(1, -1);
      cx.filter = 'blur(2px)';
      Pintores.pintar(cx, J.lugar, fx, fy, E, t, extra);
      /* Bel tambien se refleja. Reflejar la figura y a ella no la reflejaba
         era peor que no tener reflejo: se veia una mancha en el medio del
         suelo, sin nada de este lado que la explicara, y quien mira supone
         que el reflejo es de la persona porque es lo unico vivo en cuadro. */
      Bel.dibujar(cx, bel, W * J.belX, piso,
                  (H * (vertical ? .20 : .255)) / 176, 1);
      cx.filter = 'none';
      cx.restore();
    }

    // Niebla baja: dos bandas lentas que se cruzan sobre la linea del piso.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (var nb = 0; nb < 2; nb++) {
      var desliz = ((t * (.008 + nb * .005)) % 1) * W * 2 - W * .5;
      var gn = cx.createLinearGradient(0, piso - E * .16, 0, piso + E * .10);
      gn.addColorStop(0, 'rgba(150,150,200,0)');
      gn.addColorStop(.5, 'rgba(150,150,200,' + (.030 - nb * .010) + ')');
      gn.addColorStop(1, 'rgba(150,150,200,0)');
      cx.fillStyle = gn;
      cx.beginPath();
      cx.ellipse(desliz, piso - E * .03, W * .75, E * .13, 0, 0, 6.2832);
      cx.fill();
    }
    cx.restore();

    /* La linea del horizonte no es una linea: es una banda que se enciende en
       el medio y se apaga a los costados. Un trazo de un pixel de lado a lado
       corta el cuadro en dos mitades y se lee como el borde de un recuadro,
       no como el suelo de un lugar. */
    var gh2 = cx.createLinearGradient(0, 0, W, 0);
    gh2.addColorStop(0, 'rgba(180,160,220,0)');
    gh2.addColorStop(.28, 'rgba(180,160,220,.10)');
    gh2.addColorStop(.55, 'rgba(190,172,230,.16)');
    gh2.addColorStop(.82, 'rgba(180,160,220,.08)');
    gh2.addColorStop(1, 'rgba(180,160,220,0)');
    cx.fillStyle = gh2;
    cx.fillRect(0, piso, W, 1.2);

    /* Y la penumbra de donde salen las cartas. Sin esto la mano aparece
       recortada contra el suelo: se ve donde termina el dibujo y empieza el
       HTML. Con la penumbra, las cartas emergen de la sombra. */
    var techoCartas = techoMano();
    var gp2 = cx.createLinearGradient(0, techoCartas - H * .13, 0, H);
    gp2.addColorStop(0, 'rgba(4,3,10,0)');
    gp2.addColorStop(.45, 'rgba(4,3,10,.30)');
    gp2.addColorStop(1, 'rgba(4,3,10,.72)');
    cx.fillStyle = gp2;
    cx.fillRect(0, techoCartas - H * .13, W, H - techoCartas + H * .13);

    // --- Bel ---
    /* Donde se planta Bel: siempre entre el borde izquierdo del cuadro y el de
       la figura, mas cerca de la figura cuanto mas grande sea lo que mira.
       Medida contra la figura sola le queda encima; contra el ancho de la
       pantalla sola, en la otra punta. */
    /* Se planta en el hueco que queda a la izquierda de la figura, mas cerca
       o mas lejos segun lo grande que sea lo que mira. Contra una fraccion
       fija del ancho quedaba encima de la figura en cuanto esta se centro. */
    var lejania = LEJANIA[J.lugar] === undefined ? .26 : LEJANIA[J.lugar];
    var bordeFigura = fx - E;
    /* El tope de la izquierda tiene que contar el ancho de Bel, no solo su
       marca. Un 5,5% del ancho son 21 px en un celular de 375, y ella ocupa
       unos 24 a cada lado de su marca: el centro entraba y el hombro izquierdo
       quedaba afuera. Se la veia cortada por el borde justo en la cama, que es
       la escena del final. El .15 sale del dibujo: el cuerpo mas la melena no
       pasan de esa fraccion del alto (la sombra del piso mide .12). */
    var altoBelAqui = H * (vertical ? .20 : .255);
    var medioBel = altoBelAqui * .15;
    var metaCalculada = Math.max(
      Math.max(W * .055, medioBel + W * .015), // entera dentro del cuadro
      Math.min(bordeFigura * (.62 - lejania * .55), bordeFigura - W * .045)
    ) / W;
    if (Math.abs(J.belMeta - metaCalculada) > .004) J.belMeta = metaCalculada;
    var belPantalla = W * J.belX;
    // Siempre de cara a lo que esta mirando, camine hacia donde camine.
    bel.mirando = (fx >= belPantalla) ? 1 : -1;
    var altura = (piso - fy) / Math.max(1, piso);
    var objetivoAlza = Math.max(0, Math.min(1, (altura - .12) * 1.9));
    // En modo captura dt es 0 y la interpolación no avanzaría nunca.
    if (sinBucle) bel.alza = objetivoAlza;
    else bel.alza += (objetivoAlza - bel.alza) * (1 - Math.pow(.02, dt));
    // Cinturon: la cabeza gira -alza*.46 radianes, y fuera de 0..1 eso deja
    // de ser un gesto y pasa a ser una cabeza dada vuelta.
    bel.alza = Math.max(0, Math.min(1, bel.alza));

    // Sombra bajo Bel: sin esto flota sobre la linea del piso.
    var altoBel = H * (vertical ? .20 : .255);
    /* Las dos cajas quedan anotadas para que se puedan verificar desde afuera:
       medirlas por pixeles no se puede —el fondo tiene degrade y la sombra
       tine el piso— y sin esto no hay forma de saber si alguien se sale del
       cuadro o si se pisan entre ellos. */
    J.belCaja = { izq: belPantalla - altoBel * .15, der: belPantalla + altoBel * .15,
                  techo: piso - altoBel, piso: piso };
    J.figCaja = { izq: fx - E, der: fx + E, techo: fy - E, piso: piso };
    cx.save();
    var gs = cx.createRadialGradient(belPantalla, piso, 0,
                                     belPantalla, piso, altoBel * .30);
    gs.addColorStop(0, 'rgba(0,0,0,.42)');
    gs.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = gs;
    cx.beginPath();
    cx.ellipse(belPantalla, piso, altoBel * .30, altoBel * .045, 0, 0, 6.2832);
    cx.fill();
    cx.restore();

    /* La mano no se corre. Antes se la desplazaba para alinearla con el
       conjunto Bel + figura, que estaba corrido a la derecha porque la figura
       vivia en el 0,56 del ancho. Desde que la figura se centro, ese
       corrimiento es justo lo que descentra las cartas: quedaban ochenta y
       cuatro pixeles a la izquierda de la figura y del texto, que estan los dos
       en el centro exacto. */
    if (J.corrimientoMano !== 0) {
      J.corrimientoMano = 0;
      elMano.style.transform = '';
    }

    Bel.actualizar(bel, dt, J.andando);
    var luzEncima = 1 + J.fogonazo * .34;
    var escalaBel = (H * (vertical ? .20 : .255)) / 176;
    Bel.dibujar(cx, bel, belPantalla, piso, escalaBel, luzEncima);

    if (J.climax > 0) cx.restore();

    /* Lo que vio, viajando hasta el marcador. Va sobre todo el dibujo pero
       antes del vineteado, para que se apague en los bordes como el resto. */
    dibujarChispas(cx, dt, W, H);

    /* Vineteado: oscurece las esquinas y empuja la vista al centro. Va al
       final, sobre todo lo demas, incluido Bel. */
    var vin = cx.createRadialGradient(W * .5, H * .48, Math.min(W, H) * .30,
                                      W * .5, H * .48, Math.max(W, H) * .78);
    vin.addColorStop(0, 'rgba(0,0,0,0)');
    vin.addColorStop(1, 'rgba(0,0,0,.42)');
    cx.fillStyle = vin;
    cx.fillRect(0, 0, W, H);

    /* Y los bordes de arriba y abajo se apagan. Es lo que hace que el cuadro
       no termine en un canto: la imagen se disuelve en vez de cortarse. */
    var gArr = cx.createLinearGradient(0, 0, 0, H * .16);
    gArr.addColorStop(0, 'rgba(3,3,9,.62)');
    gArr.addColorStop(1, 'rgba(3,3,9,0)');
    cx.fillStyle = gArr;
    cx.fillRect(0, 0, W, H * .16);

    var gAba = cx.createLinearGradient(0, H * .84, 0, H);
    gAba.addColorStop(0, 'rgba(3,3,9,0)');
    gAba.addColorStop(1, 'rgba(3,3,9,.55)');
    cx.fillStyle = gAba;
    cx.fillRect(0, H * .84, W, H * .16);

    /* El respaldo no reengancha la cadena: el requestAnimationFrame que ya
       estaba pedido sigue vivo y se dispara cuando la pestana vuelva. Si
       reenganchara, al volver se dispararian todos juntos. */
  }

  /* El bucle no se muere por un cuadro que falla.
     Si dibujarCuadro tira una excepcion y nadie la agarra, no se vuelve a pedir
     el cuadro siguiente: la imagen queda congelada —negra, si fallo antes de
     pintar el fondo— mientras los textos siguen apareciendo, porque esos van
     por reloj. Desde afuera parece que se rompio el dibujo entero y en realidad
     se rompio una sola vez. */
  var erroresDibujo = [];
  function cuadro(ahora, deRespaldo) {
    try {
      dibujarCuadro(ahora, deRespaldo);
    } catch (e) {
      if (erroresDibujo.length < 20) {
        erroresDibujo.push(String((e && e.stack) || e));
        if (window.console) console.error('cuadro:', e);
      }
    }
    /* El respaldo no reengancha la cadena: el requestAnimationFrame que ya
       estaba pedido sigue vivo y se dispara cuando la pestana vuelva. */
    if (!sinBucle && !deRespaldo) requestAnimationFrame(cuadro);
  }
  window.erroresDeDibujo = function () { return erroresDibujo.slice(); };
  requestAnimationFrame(cuadro);

  /* Respaldo por reloj.

     Con la pestana oculta o en segundo plano el navegador deja de dar cuadros,
     y como la transformacion avanza dentro del cuadro, el juego se congelaba a
     mitad de camino: J.u se quedaba clavado abajo de 1 y el paso no terminaba
     nunca. El dibujo puede faltar — nadie lo esta mirando — pero el estado no
     puede depender de que se este dibujando. */
  setInterval(function () {
    if (sinBucle) return;
    var ahora = performance.now();
    if (ahora - anterior > 34) cuadro(ahora, true);
  }, 16);

  /* Las cartas tambien se juegan con 1, 2 y 3: el resto del juego ya se
     maneja con el teclado, y elegir carta obligaba a ir al mouse. */
  window.addEventListener('keydown', function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var i = ['1', '2', '3'].indexOf(ev.key);
    if (i === -1) return;
    var cartas = elMano.querySelectorAll('.carta');
    if (!cartas[i]) return;
    ev.preventDefault();
    cartas[i].click();
  });

  /* ---------- sonido ---------- */

  var elSonido = document.getElementById('sonido');
  var elSonidoIcono = document.getElementById('sonidoIcono');
  function pintarSonido() {
    var on = Audio2.activo();
    elSonido.setAttribute('aria-pressed', on ? 'true' : 'false');
    elSonidoIcono.textContent = on ? '♫' : '♪';
    elSonido.title = on ? 'Silenciar' : 'Con sonido';
  }
  /* La preferencia de sonido sobrevive a la recarga.
     Volver a empezar es parte del juego —el boton del final recarga la pagina—
     y eso devolvia el sonido prendido cada vez: quien lo habia silenciado tenia
     que silenciarlo de nuevo en cada partida. En try/catch porque en modo
     privado el acceso puede tirar excepcion, y quedarse sin sonido es molesto
     pero quedarse sin juego es peor. */
  var LLAVE_SILENCIO = 'elsegundo.silencio';
  var LLAVE_VOLUMEN = 'elsegundo.volumen';

  function recordarSonido() {
    try { localStorage.setItem(LLAVE_SILENCIO, Audio2.activo() ? '0' : '1'); }
    catch (e) { /* sin almacenamiento: se juega igual */ }
  }
  function preferenciaEsSilencio() {
    try { return localStorage.getItem(LLAVE_SILENCIO) === '1'; }
    catch (e) { return false; }
  }
  function volumenGuardado() {
    try {
      var v = parseFloat(localStorage.getItem(LLAVE_VOLUMEN));
      return isFinite(v) && v >= 0 && v <= 1 ? v : null;
    } catch (e) { return null; }
  }

  elSonido.addEventListener('click', function () {
    Audio2.alternar();
    pintarSonido();
    recordarSonido();
  });

  var elVol = document.getElementById('vol');
  elVol.addEventListener('input', function () {
    var v = elVol.value / 100;
    // Mover el volumen desde cero tambien prende el sonido: si no, el control
    // parece roto.
    if (v > 0 && !Audio2.activo()) { Audio2.prender(); pintarSonido(); }
    Audio2.ponerVolumen(v);
    try { localStorage.setItem(LLAVE_VOLUMEN, String(v)); } catch (e) {}
  });
  document.getElementById('empezar').addEventListener('click', function () {
    /* El primer gesto del usuario es la unica oportunidad de arrancar el audio
       — salvo que la ultima vez lo hayan dejado en silencio a proposito. */
    if (!preferenciaEsSilencio()) {
      Audio2.prender();
      var v = volumenGuardado();
      if (v !== null) {
        Audio2.ponerVolumen(v);
        if (elVol) elVol.value = Math.round(v * 100);
      }
    }
    pintarSonido();
    empezar();
  });
  pintarSonido();

  /* ---------- herramientas de revisión ---------- */

  window.capturar = function (nombre) {
    return fetch('/_captura/' + nombre + '.png',
      { method: 'POST', body: cv.toDataURL('image/png') });
  };

  window.instante = function (figura, nombre, opciones) {
    opciones = opciones || {};
    if (figura) { J.lugar = figura; J.u = 1; J.destino = null; J.congelado = false; }
    if (opciones.destino) {
      J.pares = Figuras.preparar(J.lugar, opciones.destino);
      J.destino = { figura: opciones.destino, color: opciones.color || '200,200,255' };
      J.u = opciones.u === undefined ? .5 : opciones.u;
      J.fogonazo = 1 - J.u;
    }
    /* Con dt=0 el destello y el fallo del instante no decaen nunca y quedan
       pintados encima de la captura. Se limpian salvo que se pidan. */
    if (!opciones.conInstante) {
      mirada.activo = false; mirada.destello = 0; mirada.fallo = 0;
    }
    J.belX = (opciones.belX !== undefined) ? opciones.belX : J.belMeta;
    if (opciones.t !== undefined) t = opciones.t;
    if (opciones.tension !== undefined) {
      J.tension = J.tensionSuave = opciones.tension;
    }
    if (opciones.climax !== undefined) J.climax = opciones.climax;
    /* Cuantos indicios dar por encontrados. Es lo unico que mueve la fase
       de la luna, asi que sin esto no hay forma de capturarla en otra cosa
       que no sea luna nueva. */
    if (opciones.indicios !== undefined) {
      J.indicios = [];
      for (var qi = 0; qi < opciones.indicios; qi++) J.indicios.push('prueba' + qi);
    }
    if (opciones.empuje !== undefined) bel.empuje = opciones.empuje;
    if (opciones.asombro !== undefined) bel.asombro = opciones.asombro;
    // El modo captura tambien reajusta: si no, una captura tras un resize sale
    // con el tamano viejo y parece un bug del dibujo.
    if (revisarTamanio()) pintarNaipes();
    sinBucle = true;
    cuadro(performance.now());
    sinBucle = false;
    return nombre ? window.capturar(nombre) : Promise.resolve({ status: 200 });
  };

  /* Devuelve la mano que se repartiria en un paso dado, sin jugar nada. Es la
     unica forma de comprobar el reparto sin depender de los tiempos. */
  window.manoDe = function (paso, lugar, recorrido) {
    /* Guarda y restaura tambien el MAZO. Sin eso, preguntarle por la mano del
       primer paso despues de haber jugado devolvia lo que quedaba del mazo
       gastado — siempre las mismas tres cartas — y parecia que el reparto era
       fijo cuando en realidad la herramienta estaba mirando otra partida. */
    var pasoAntes = J.paso, lugarAntes = J.lugar, vistosAntes = J.visitados;
    var mazoAntes = J.mazo.slice(), recAntes = J.recorrido;
    J.paso = paso === undefined ? 0 : paso;
    J.lugar = lugar || Guion.ARRANQUE;
    /* El recorrido importa: de el sale de donde se viene, y eso decide si una
       carta que hace retroceder se reparte o se guarda para el final. */
    if (recorrido) {
      J.recorrido = recorrido.slice();
      J.visitados = {};
      recorrido.forEach(function (k) { J.visitados[k] = true; });
      J.mazo = mazoAntes.slice();
    } else {
      J.visitados = {};
      J.mazo = Guion.CARTAS.map(function (c) { return c.clave; });
    }
    var m = repartir(3);
    J.paso = pasoAntes; J.lugar = lugarAntes; J.visitados = vistosAntes;
    J.mazo = mazoAntes; J.recorrido = recAntes;
    return m;
  };

  /* Estado interno, para poder verificar sin adivinar por captura. */
  window.estadoJuego = function () {
    return {
      paso: J.paso, lugar: J.lugar, belX: +J.belX.toFixed(4),
      belMeta: +J.belMeta.toFixed(4), andando: J.andando,
      indicios: J.indicios.length, perdidos: J.perdidos.length,
      u: +J.u.toFixed(3), jugando: J.jugando,
      destino: J.destino, cuadros: cuadrosDibujados,
      faseLuna: +faseLuna().toFixed(3),
      belAlza: +bel.alza.toFixed(3),   // fuera de 0..1 la cabeza queda dada vuelta
      congelado: J.congelado, revelando: +J.revelando.toFixed(2),
      miradaActiva: mirada.activo, miradaResuelta: mirada.resuelto,
      mirando: mirada.sosteniendo, lleno: +mirada.lleno.toFixed(2),
      hayDestino: !!J.destino, esperandoToque: !!esperando,
      relojesVivos: relojes.length + colaPrueba.length,
      ritmo: RITMO,
      relojAdelantado: Math.round(anterior - performance.now()),
      lunaSigno: lunaReal ? lunaReal.signoNombre : null
    };
  };

  /* Comprueba que cada figura quede donde tiene que quedar. */
  window.verificarBases = function () {
    var vertical = H > W * 1.25;
    var piso = Math.min(H * (vertical ? .80 : .84), techoMano() + H * .05);
    var E = Math.max(W * .08, Math.min(vertical ? W * .30 : W * .27,
                     (piso - H * (vertical ? .27 : .29)) / 2));
    var mal = [];
    Object.keys(Figuras.CATALOGO).forEach(function (k) {
      var fy = alturaDe(k, null, 1, piso, E);
      var b = BASES[k];
      var apoya = (b !== null && b !== undefined);
      var borde = apoya ? fy + E * b : fy + E;
      if (apoya && Math.abs(borde - piso) > 1.5) mal.push(k + ' no apoya');
      if (!apoya && borde >= piso - 1) mal.push(k + ' deberia volar y toca el piso');
    });
    return { total: Object.keys(Figuras.CATALOGO).length, mal: mal, ok: !mal.length };
  };

  /* Fuerza el resultado del instante sin depender del reloj del navegador: con
     la pestaña oculta la mutación no avanza y no habría forma de probarlo. */
  window.forzarMirada = function (acierta) {
    if (!mirada.activo || mirada.resuelto) return 'no habia nada que mirar';
    mirada.resuelto = true;
    mirada.resultado = acierta ? 'visto' : 'siguio';
    mirada.lleno = acierta ? 1 : 0;
    if (acierta) mirada.destello = 1;
    resolverMirada();
    return mirada.resultado;
  };

  /* Juega una partida entera a velocidad acelerada. `mirar` decide si acierta
     el instante en cada paso: puede ser un booleano o una función. */
  var pruebaEnCurso = null;

  window.pruebaPartida = function (opciones) {
    opciones = opciones || {};
    /* Si quedo una prueba anterior dando vueltas — el tool que la lanzo corto
       antes de que terminara, por ejemplo — hay que matarla: dos pruebas a la
       vez se pisan el RITMO y la segunda corre a velocidad normal. */
    if (pruebaEnCurso) { clearInterval(pruebaEnCurso); pruebaEnCurso = null; }
    var elegir = opciones.elegir || function () { return 0; };
    var mirar = opciones.mirar === undefined ? false : opciones.mirar;
    RITMO = opciones.ritmo || 60;
    enPrueba = true;
    var errores = [];
    var previo = window.onerror;
    window.onerror = function (m) { errores.push(String(m)); };

    return new Promise(function (resolver) {
      // Estado limpio.
      frenarRelojes();
      document.getElementById('portada').classList.add('ido');
      J.paso = 0; J.lugar = Guion.ARRANQUE; J.visitados = {};
      J.jugando = false;
      J.tension = 0; J.tensionSuave = 0; J.climax = 0;
      J.recorrido = [Guion.ARRANQUE]; J.indicios = []; J.perdidos = [];
      J.esconde = null; J.vioAhora = null;
      J.mazo = Guion.CARTAS.map(function (c) { return c.clave; });
      J.jugadas = []; J.u = 1; J.destino = null;
      mirada.activo = false; mirada.resuelto = false;
      elCierre.classList.remove('ver');
      elMano.innerHTML = '';
      llegar(true);

      var vueltas = 0, jugados = 0;
      /* Por donde anduvo Bel. Que se vaya del cuadro y vuelva caminando ya
         aparecio tres veces por causas distintas, asi que conviene que
         quede medido en cada partida y no depender de que alguien mire. */
      var belMin = J.belX, belMax = J.belX;
      var reloj = pruebaEnCurso = setInterval(function () {
        vueltas++;
        /* El navegador frena los timers de una pestana oculta a uno por
           segundo, y con eso la mutacion tarda una eternidad en completarse.
           En cada vuelta se adelantan cuadros a mano, con dt sintetico, para
           que el estado avance aunque el reloj del navegador este frenado. */
        /* La mirada se revisa DENTRO del adelanto, no despues: la ventana
           del instante dura menos que un bloque de cuadros, asi que mirandola
           solo entre vueltas se abria y se cerraba sin que la prueba llegara
           nunca a tocarla — y todas las partidas simuladas terminaban con cero
           indicios, que es justo lo que se queria poder probar. */
        for (var f = 0; f < 120; f++) {
          cuadro(anterior + 16, true);
          avanzarRelojPrueba(16);
          if (J.belX < belMin) belMin = J.belX;
          if (J.belX > belMax) belMax = J.belX;
          if (mirada.activo && !mirada.resuelto) {
            var q = (typeof mirar === 'function') ? mirar(jugados) : mirar;
            if (q) window.forzarMirada(true);
          }
        }
        if (vueltas > 6000) { cerrar('agoto el tiempo'); return; }
        if (elCierre.classList.contains('ver')) { cerrar(null); return; }

        var cartas = elMano.classList.contains('fuera')
          ? [] : elMano.querySelectorAll('.carta');
        if (cartas.length && J.u >= 1) {
          jugados++;
          var i = Math.min(cartas.length - 1,
                           Math.max(0, elegir(jugados - 1, cartas.length)));
          cartas[i].click();
        }
      }, 8);

      function cerrar(motivo) {
        clearInterval(reloj);
        // El reloj vuelve al tiempo real: la prueba lo dejaba en el futuro y
        // el juego siguiente arrancaba paralizado.
        anterior = performance.now();
        if (pruebaEnCurso === reloj) pruebaEnCurso = null;
        enPrueba = false;
        RITMO = RAPIDO ? RITMO_RAPIDO : RITMO_NORMAL;
        window.onerror = previo;
        resolver({
          pasos: J.paso,
          recorrido: J.recorrido.slice(),
          indicios: J.indicios.length,
          jugadas: J.jugadas.slice(),
          cierre: elCierre.classList.contains('ver'),
          textoCierre: (elCierre.textContent || '').slice(0, 80),
          // La cama solo puede ser el ultimo eslabon del recorrido.
          camaTemprana: J.recorrido.slice(0, -1).indexOf('cama') !== -1,
          belMin: +belMin.toFixed(4), belMax: +belMax.toFixed(4),
          belSeFue: belMin < 0 || belMax > 1,
          errores: errores,
          motivo: motivo
        });
      }
    });
  };

  /* Corre muchas partidas y resume: variedad de recorridos y si la cama se
     coló antes de tiempo. */
  window.simularMuchas = function (n, opciones) {
    n = n || 50;
    var vistos = {}, camas = 0, fallos = 0, errores = 0, indicios = [];
    var i = 0;
    function una() {
      if (i >= n) {
        var suma = indicios.reduce(function (a, b) { return a + b; }, 0);
        return Promise.resolve({
          partidas: n,
          recorridosDistintos: Object.keys(vistos).length,
          camaTemprana: camas,
          sinCierre: fallos,
          conErrores: errores,
          indiciosProm: indicios.length ? +(suma / indicios.length).toFixed(2) : 0
        });
      }
      i++;
      var op = { elegir: function () { return Math.floor(Math.random() * 3); } };
      if (opciones) {
        Object.keys(opciones).forEach(function (k) { op[k] = opciones[k]; });
      }
      return window.pruebaPartida(op).then(function (p) {
        vistos[p.recorrido.join('>')] = true;
        if (p.camaTemprana) camas++;
        if (!p.cierre) fallos++;
        if (p.errores.length) errores++;
        indicios.push(p.indicios);
        return una();
      });
    }
    return una();
  };

  /* Dibuja un cuadro de cada figura y de cada etapa de una mutacion, y avisa
     si alguno rompe. Hace falta porque con la pestaña oculta requestAnimationFrame
     da cero frames: las partidas simuladas pasan sin dibujar nunca, y un error
     de dibujo se cuela hasta la pantalla del jugador sin que nada lo note. */
  window.verificarDibujo = function () {
    var fallos = [];
    var previo = window.onerror;
    Object.keys(Figuras.CATALOGO).forEach(function (k) {
      try { window.instante(k, null, { t: 2 }); }
      catch (e) { fallos.push(k + ': ' + e.message); }
    });
    // Y una mutacion en curso, que es cuando se dibuja el instante.
    [0, .25, .5, .75, .99].forEach(function (u) {
      try {
        window.instante('montania', null, { t: 2, destino: 'platillo', u: u });
        Instante.arrancar(mirada, W * .5, H * .4, 90);
        mirada.u = u;
        window.instante('montania', null, { t: 2, destino: 'platillo', u: u });
      } catch (e) { fallos.push('mutacion u=' + u + ': ' + e.message); }
    });
    mirada.activo = false;
    window.onerror = previo;
    return { figuras: Object.keys(Figuras.CATALOGO).length, fallos: fallos, ok: !fallos.length };
  };

  /* Recorre lugares y cartas y avisa si falta algo. */
  /* Corre una partida y vigila que el cartel diga siempre lo que se esta
     dibujando. Este desajuste no lo caza ninguna otra prueba: el juego
     funciona, no tira errores y las figuras estan bien — simplemente en
     pantalla se lee un nombre que no es el de lo que se ve. */
  window.verificarRotulo = function () {
    var NOMBRE = {};
    ['montania','platillo','calesita','laguna','faro','casa','arbol','reloj',
     'luna','puerta','ruina','bandada','barca','cama'].forEach(function (k) {
      var l = Guion.lugar(k);
      if (l) NOMBRE[l.nombre] = k;
    });
    var malos = [];
    window.pruebaPartida({ mirar: true });
    return new Promise(function (resolver) {
      var vueltas = 0;
      var reloj = setInterval(function () {
        vueltas++;
        var e = window.estadoJuego();
        var esperado = NOMBRE[elRotulo.textContent];
        if (elRotulo.classList.contains('ver') && esperado && esperado !== e.lugar) {
          malos.push({ rotulo: elRotulo.textContent, dibujando: e.lugar, u: e.u });
        }
        if (elCierre.classList.contains('ver') || vueltas > 400) {
          clearInterval(reloj);
          resolver({ desajustes: malos.length, muestra: malos.slice(0, 3),
                     ok: malos.length === 0 });
        }
      }, 60);
    });
  };

  /* Corre varias partidas y comprueba que el arco se cumpla siempre: que los
     recuerdos vengan primero, que el tramo del medio sea el que toca y en el
     orden que toca, y que lo que queda venga despues. Sin esto, una carta mal
     ubicada desarma la estructura sin romper nada — el juego sigue andando y
     nadie se entera. */
  /* La auditoria entera, de una. Devuelve un veredicto por area y uno global,
     para no tener que acordarse de correr seis cosas distintas. */
  /* Salta directo al cierre con la cantidad de indicios que se pida. Sirve
     para ver los cuatro finales sin jugar cuatro partidas, y para probarlos:
     son la parte del juego que menos se recorre y la que mas importa. */
  /* Los textos, sin copia de referencia.

     Antes esto se comparaba contra un JSON con los textos duplicados. Cuando
     el guion cambiaba —y cambio, la llegada del faro— el snapshot quedaba
     viejo y la verificacion acusaba una diferencia que era suya, no del juego.
     El guion es la fuente y no hay que tener dos.

     Lo que se busca son corrupciones, que es lo que de verdad pasa: palabras
     pegadas al concatenar lineas, campos vacios, la voz que se escapa a la
     tercera persona, o algo real nombrado con todas las letras. */
  /* Que cada anomalia se VEA.

     Es la prueba que le falta al juego: una anomalia que no cambia nada en
     pantalla no es una anomalia, es un parrafo. Para cada lugar se pinta la
     escena, se cuentan los pixeles, se pinta la anomalia encima y se vuelve a
     contar. Si la diferencia es chica, no se ve — por mas linda que sea la
     idea o por bien que se vea en una lamina aislada.

     Usa el buffer del canvas y no su tamano en pantalla: con la pestana oculta
     el segundo es cero y la prueba mide sobre la nada. */
  window.verificarAnomalias = function () {
    var cv2 = document.createElement('canvas');
    var W = 1100, H = 700;
    cv2.width = W; cv2.height = H;
    var c2 = cv2.getContext('2d');
    var vertical = H > W * 1.25;
    var piso = H * .83;
    var E = Math.max(W * .08, Math.min(W * .27, (piso - H * .29) / 2));
    var fx = W * .5, fy = piso - E, belX = W * .18;

    /* Cuantos pixeles CAMBIARON, no cuantos hay.

       Contar el total daba cero en las anomalias que se dibujan encima de la
       figura —la casa, el reloj, la luna, la puerta— porque no agregan
       superficie, la modifican. Con el total, cuatro anomalias que se ven
       perfecto figuraban como invisibles. */
    function foto() {
      return c2.getImageData(0, 0, W, H).data;
    }
    function cuantosCambiaron(a, b) {
      var n = 0;
      for (var i = 0; i < a.length; i += 4) {
        if (Math.abs(a[i] - b[i]) > 10 ||
            Math.abs(a[i + 1] - b[i + 1]) > 10 ||
            Math.abs(a[i + 2] - b[i + 2]) > 10) n++;
      }
      return n;
    }

    var flojas = [], tabla = [];
    ['montania', 'platillo', 'calesita', 'laguna', 'faro', 'casa', 'arbol',
     'reloj', 'luna', 'puerta', 'ruina', 'bandada', 'barca', 'cama'].forEach(function (k) {
      c2.setTransform(1, 0, 0, 1, 0, 0);
      c2.fillStyle = '#0b0917';
      c2.fillRect(0, 0, W, H);
      c2.save();
      Pintores.pintar(c2, k, fx, fy, E, 3, { alPiso: E, tension: 0,
                                             perfil: Figuras.perfilMontania() });
      c2.restore();
      var antes = foto();
      Anomalias.pintar(c2, k, fx, fy, E, 3, 1, {}, W, H, belX, piso);
      var cambio = cuantosCambiaron(antes, foto());
      tabla.push({ lugar: k, pixeles: cambio });
      // Mil pixeles sobre setecientos mil es poco, pero alcanza para que el ojo
      // registre que algo aparecio donde no habia nada.
      if (cambio < 900) flojas.push({ lugar: k, pixeles: cambio });
    });

    tabla.sort(function (a, b) { return a.pixeles - b.pixeles; });
    return { flojas: flojas, ok: flojas.length === 0, tabla: tabla };
  };

  window.verificarTextos = function () {
    var fallas = [];
    var CLAVES = ['montania', 'platillo', 'calesita', 'laguna', 'faro', 'casa',
                  'arbol', 'reloj', 'luna', 'puerta', 'ruina', 'bandada',
                  'barca', 'cama'];

    function revisar(donde, txt, minimo) {
      if (!txt || !txt.trim()) { fallas.push(donde + ': vacio'); return; }
      if (txt.length < minimo) fallas.push(donde + ': muy corto (' + txt.length + ')');
      // Dos palabras pegadas por un corte de linea mal armado.
      if (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(txt)) fallas.push(donde + ': palabras pegadas');
      if (/\s\s/.test(txt)) fallas.push(donde + ': espacio doble');
      if (/\s$|^\s/.test(txt)) fallas.push(donde + ': espacio al borde');
      // Nada real nombrado, y nada en tercera persona.
      /* Se le sacan los acentos al texto antes de buscar, y el patron se
         escribe con clases y no con \b: en JavaScript \b no cierra sobre una
         vocal acentuada —la a con tilde no cuenta como caracter de palabra—
         asi que un patron con \b alrededor de 'mama' no caza 'mama'. */
      var plano = txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (/(^|[^a-z])(bel|tigre|mama|madre)([^a-z]|$)/i.test(plano)) {
        fallas.push(donde + ': nombra algo real');
      }
    }

    CLAVES.forEach(function (k) {
      var l = Guion.lugar(k);
      if (!l) { fallas.push(k + ': no existe'); return; }
      if (!l.nombre) fallas.push(k + ': sin nombre');
      if (!Guion.lugar(l.revela)) fallas.push(k + ': revela apunta a un lugar que no existe');
      revisar(k + '.llegada', l.llegada, 60);
      revisar(k + '.vuelta', l.vuelta, 40);
      // La cama esconde seis palabras a proposito: ahi esta toda su fuerza.
      revisar(k + '.esconde', l.esconde, k === 'cama' ? 20 : 60);
    });

    Guion.CARTAS.forEach(function (c) {
      ['clave', 'num', 'nombre', 'lectura', 'accion', 'astro'].forEach(function (campo) {
        if (!c[campo]) fallas.push(c.clave + ': sin ' + campo);
      });
      revisar(c.clave + '.lectura', c.lectura, 12);
      revisar(c.clave + '.accion', c.accion, 12);
      if (!c.revela && !Guion.lugar(c.figura)) fallas.push(c.clave + ': figura inexistente');
    });

    // La carta de papel: es de Nico y ahi si puede decir Bel.
    var carta = Guion.CARTA_PARA_BEL;
    if (!carta || !carta.parrafos || carta.parrafos.length < 10) fallas.push('la carta de papel esta incompleta');
    if (!carta.firma) fallas.push('la carta de papel no esta firmada');
    carta.parrafos.forEach(function (t, i) {
      if (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(t)) fallas.push('carta parrafo ' + i + ': palabras pegadas');
    });

    return { fallas: fallas, cuantas: fallas.length, ok: fallas.length === 0 };
  };

  /* Modo rapido: para probar el juego sin esperar los tiempos de lectura.

     Se prende con la tecla R, o entrando con ?rapido en la direccion. Todo va
     al triple y los textos avanzan solos, asi que una partida entera se ve en
     un rato en vez de en varios minutos.

     Lleva un cartel fijo arriba a proposito: es un modo para trabajar, y lo
     peor que puede pasar es mostrarselo a alguien sin darse cuenta de que
     esta puesto. */
  var elRapido = null;

  function pintarRapido() {
    if (!elRapido) {
      elRapido = document.createElement('div');
      elRapido.id = 'avisoRapido';
      elRapido.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99;' +
        'text-align:center;font:600 11px/1.9 system-ui,sans-serif;letter-spacing:.18em;' +
        'text-transform:uppercase;color:#1a1206;background:rgba(220,178,108,.92);' +
        'pointer-events:none';
      document.body.appendChild(elRapido);
    }
    elRapido.textContent = 'modo rápido · R para volver al normal';
    elRapido.style.display = RAPIDO ? 'block' : 'none';
  }

  window.rapido = function (quiero) {
    RAPIDO = (quiero === undefined) ? !RAPIDO : !!quiero;
    if (!enPrueba) RITMO = RAPIDO ? RITMO_RAPIDO : RITMO_NORMAL;
    pintarRapido();
    // Si habia un texto esperando el toque, que siga solo y no quede colgado.
    if (RAPIDO && esperando) avanzar();
    return RAPIDO ? 'rapido (x' + RITMO_RAPIDO + ')' : 'normal';
  };

  // Se puede entrar directo en rapido: /index.html?rapido
  if (/(^|[?&])rapido($|[&=])/.test(location.search)) window.rapido(true);

  window.addEventListener('keydown', function (ev) {
    if (ev.key !== 'r' && ev.key !== 'R') return;
    var f = document.activeElement;
    if (f && f !== document.body && typeof f.closest === 'function' &&
        f.closest('input,textarea,button')) return;
    window.rapido();
  });

  /* ---------- panel de pruebas ---------- */

  /* Se abre con T o con ?test, y nunca aparece por su cuenta. Junta las tres
     cosas que hacen falta para probar sin jugar: la velocidad, saltar a un
     lugar cualquiera y ver cualquiera de los cuatro finales. */
  var elPanel = null;

  function armarPanel() {
    if (elPanel) return elPanel;
    elPanel = document.createElement('div');
    elPanel.id = 'panelPruebas';
    elPanel.style.cssText =
      'position:fixed;top:0;right:0;z-index:200;width:min(260px,86vw);' +
      'max-height:100vh;overflow:auto;padding:12px 14px 16px;' +
      'background:rgba(10,9,20,.96);border-left:1px solid rgba(220,178,108,.35);' +
      'border-bottom:1px solid rgba(220,178,108,.35);' +
      'font:12px/1.5 system-ui,"Segoe UI",sans-serif;color:#e9dec9;display:none';

    function titulo(t) {
      var h = document.createElement('div');
      h.textContent = t;
      h.style.cssText = 'margin:12px 0 6px;font-size:10px;letter-spacing:.14em;' +
        'text-transform:uppercase;color:rgba(220,178,108,.85)';
      elPanel.appendChild(h);
      return h;
    }
    function boton(t, fn, ancho) {
      var b = document.createElement('button');
      b.textContent = t;
      b.style.cssText = 'display:inline-block;margin:0 4px 4px 0;padding:5px 8px;' +
        'font:inherit;cursor:pointer;color:#e9dec9;background:rgba(255,255,255,.06);' +
        'border:1px solid rgba(255,255,255,.16);border-radius:3px' +
        (ancho ? ';width:100%' : '');
      b.addEventListener('click', function (ev) { ev.stopPropagation(); fn(b); });
      elPanel.appendChild(b);
      return b;
    }

    var cerrar = document.createElement('button');
    cerrar.textContent = '✕';
    cerrar.title = 'cerrar (T)';
    cerrar.style.cssText = 'float:right;background:none;border:0;color:#e9dec9;' +
      'font-size:15px;cursor:pointer;line-height:1;padding:0 2px';
    cerrar.addEventListener('click', function () { window.panel(false); });
    elPanel.appendChild(cerrar);

    var cab = document.createElement('div');
    cab.textContent = 'pruebas';
    cab.style.cssText = 'font-size:10px;letter-spacing:.16em;text-transform:uppercase;' +
      'color:rgba(220,178,108,.85)';
    elPanel.appendChild(cab);

    titulo('velocidad');
    var bRapido = boton('', function () {
      window.rapido();
      bRapido.textContent = RAPIDO ? 'rápido ×' + RITMO_RAPIDO + ' — apagar' : 'poner en rápido ×' + RITMO_RAPIDO;
    }, true);
    bRapido.textContent = RAPIDO ? 'rápido ×' + RITMO_RAPIDO + ' — apagar' : 'poner en rápido ×' + RITMO_RAPIDO;

    titulo('ir a un lugar');
    ['montania', 'platillo', 'calesita', 'laguna', 'faro', 'casa', 'arbol',
     'reloj', 'luna', 'puerta', 'ruina', 'bandada', 'barca', 'cama'].forEach(function (k) {
      var l = Guion.lugar(k);
      boton(l ? l.nombre : k, function () { window.irA(k); });
    });

    titulo('ver un final');
    [['0 · La Durmiente', 0], ['2 · La Que Se Despierta', 2],
     ['4 · La Testigo', 4], ['8 · La Astróloga', 8]].forEach(function (par) {
      boton(par[0], function () { window.verFinal(par[1]); }, true);
    });

    titulo('el sobre y la carta');
    boton('el sobre cerrado', function () { window.verSobre(); }, true);
    boton('la carta de papel', function () { window.verCarta(); }, true);

    titulo('otros');
    boton('reiniciar', function () { location.reload(); }, true);

    var pie = document.createElement('div');
    pie.textContent = 'T abre y cierra este panel · R prende el modo rápido';
    pie.style.cssText = 'margin-top:12px;font-size:10px;line-height:1.5;color:rgba(233,222,201,.45)';
    elPanel.appendChild(pie);

    document.body.appendChild(elPanel);
    return elPanel;
  }

  /* La carta de papel, directo. Es lo ultimo del juego y lo que mas se va a
     retocar, asi que llegar hasta ella jugando ocho pasos cada vez no tiene
     sentido. Arma la hoja igual que abrirCarta y la muestra. */
  window.verCarta = function () {
    frenarRelojes();
    document.getElementById('portada').classList.add('ido');
    ['cierre', 'final', 'sobre'].forEach(function (id) {
      document.getElementById(id).classList.remove('ver');
    });
    var hoja = document.getElementById('hoja');
    if (!hoja.children.length) {
      var c = Guion.CARTA_PARA_BEL;
      c.parrafos.forEach(function (t2) {
        var p2 = document.createElement('p');
        p2.textContent = t2;
        hoja.appendChild(p2);
      });
      var f = document.createElement('p');
      f.className = 'firma';
      f.textContent = c.firma;
      hoja.appendChild(f);
    }
    var capa = document.getElementById('cartaEscrita');
    capa.classList.add('ver');
    // Siempre desde el saludo: la carta es mas alta que la pantalla y si queda
    // el scroll de antes se abre por la mitad de una frase.
    capa.scrollTop = 0;
    return 'carta a la vista';
  };

  /* Y el sobre cerrado, que es el paso anterior. */
  window.verSobre = function () {
    frenarRelojes();
    document.getElementById('portada').classList.add('ido');
    ['cierre', 'final', 'cartaEscrita'].forEach(function (id) {
      document.getElementById(id).classList.remove('ver');
    });
    mostrarSobre();
    return 'sobre a la vista';
  };

  window.panel = function (quiero) {
    var el = armarPanel();
    var abierto = el.style.display === 'block';
    var ahora = (quiero === undefined) ? !abierto : !!quiero;
    el.style.display = ahora ? 'block' : 'none';
    return ahora ? 'panel abierto' : 'panel cerrado';
  };

  /* Salta a un lugar sin jugar hasta llegar. Deja el paso donde esta: la idea
     es mirar el lugar, no falsear una partida. */
  window.irA = function (clave) {
    var l = Guion.lugar(clave);
    if (!l) return 'no existe ese lugar';
    frenarRelojes();
    document.getElementById('portada').classList.add('ido');
    ['cierre', 'final', 'sobre', 'cartaEscrita'].forEach(function (id) {
      document.getElementById(id).classList.remove('ver');
    });
    var vs = document.getElementById('haciaSobre');
    if (vs) vs.remove();
    J.lugar = clave;
    J.u = 1;
    J.destino = null;
    J.congelado = false;
    J.jugando = false;
    mirada.activo = false;
    mirada.resuelto = false;
    if (J.recorrido[J.recorrido.length - 1] !== clave) J.recorrido.push(clave);
    elMano.classList.remove('fuera');
    elMarcador.classList.add('ver');
    ponerRotulo(clave);
    decir(J.visitados[clave] ? l.vuelta : l.llegada, mostrarMano);
    J.visitados[clave] = true;
    return 'en ' + l.nombre;
  };

  if (/(^|[?&])test($|[&=])/.test(location.search)) window.panel(true);

  window.addEventListener('keydown', function (ev) {
    if (ev.key !== 't' && ev.key !== 'T') return;
    var f = document.activeElement;
    if (f && f !== document.body && typeof f.closest === 'function' &&
        f.closest('input,textarea,button')) return;
    window.panel();
  });

  window.verFinal = function (n) {
    frenarRelojes();
    document.getElementById('portada').classList.add('ido');
    J.indicios = [];
    for (var i = 0; i < n; i++) J.indicios.push(Guion.lugar(Guion.ARRANQUE).esconde + ' ' + i);
    J.perdidos = [];
    for (var k = 0; k < Guion.PASOS - n; k++) J.perdidos.push('perdido' + k);
    J.paso = Guion.PASOS;
    J.lugar = 'cama';
    J.recorrido = ['montania', 'arbol', 'luna', 'calesita', 'barca', 'ruina', 'faro', 'casa', 'cama'];
    J.congelado = false;
    terminar();
    return Guion.cartaDeElla(J.indicios).clave;
  };

  /* El reparto, sin jugar la partida.

     Jugar partidas enteras para ver si una carta se cuela de otro tramo es
     carisimo —cada una tarda lo suyo aunque corra a x60— y encima solo prueba
     los mazos que el azar quiso. Esto llama al reparto directo, con el estado
     puesto a mano, y barre todos los pasos contra todos los lugares. */
  window.verificarReparto = function (vueltas) {
    vueltas = vueltas || 120;
    var LUGARES = ['montania', 'calesita', 'arbol', 'laguna', 'luna', 'barca',
                   'ruina', 'faro', 'platillo', 'casa', 'reloj', 'puerta',
                   'bandada', 'cama'];
    var guardado = {
      mazo: J.mazo, paso: J.paso, lugar: J.lugar,
      visitados: J.visitados, recorrido: J.recorrido
    };
    var mal = [], repartos = 0, fallos = 0;
    try {
      for (var paso = 0; paso < Guion.PASOS - 1; paso++) {
        var t = Guion.tramoDe(paso);
        if (!t) continue;
        for (var i = 0; i < LUGARES.length; i++) {
          for (var v = 0; v < vueltas; v++) {
            J.paso = paso;
            J.lugar = LUGARES[i];
            J.visitados = {};
            J.recorrido = [LUGARES[i]];
            // Un mazo cualquiera, de cualquier tamano: lo que se gasta al
            // avanzar es justo lo que dejaba a la mano sin cartas del tramo.
            J.mazo = Guion.CARTAS.map(function (c) { return c.clave; })
              .filter(function () { return Math.random() > .45; });
            if (!J.mazo.length) continue;
            var mano = repartir(3);
            repartos++;
            for (var m = 0; m < mano.length; m++) {
              var d = Guion.destino(mano[m], J.lugar);
              if (!d) continue;
              var bien = t.libre ? t.lugares.indexOf(d) !== -1
                                 : d === Guion.forzado(paso);
              if (bien) continue;
              fallos++;
              // Se guardan unos pocos como muestra; el conteo va aparte.
              if (mal.length < 8) {
                mal.push({ paso: paso, desde: LUGARES[i], carta: mano[m],
                           lleva: d, tramo: t.nombre });
              }
            }
          }
        }
      }
    } finally {
      J.mazo = guardado.mazo; J.paso = guardado.paso; J.lugar = guardado.lugar;
      J.visitados = guardado.visitados; J.recorrido = guardado.recorrido;
    }
    return { repartos: repartos, fallos: fallos, mal: mal, ok: !fallos };
  };

  /* Con que frecuencia sale cada lugar.

     Un lugar entero —con su texto, su dibujo y su anomalia— que aparezca en
     una partida de cada cien es un lugar que Bel no va a ver nunca. Esto
     recorre partidas usando el reparto de verdad, pero sin dibujar ni esperar
     a nadie, asi que en un segundo mide lo que jugando tardaria una tarde. */
  window.frecuenciaLugares = function (partidas) {
    partidas = partidas || 500;
    var guardado = {
      mazo: J.mazo, paso: J.paso, lugar: J.lugar,
      visitados: J.visitados, recorrido: J.recorrido
    };
    var cuenta = {};
    try {
      for (var p = 0; p < partidas; p++) {
        J.mazo = mezclar(Guion.CARTAS.map(function (c) { return c.clave; }));
        J.lugar = 'montania';
        J.visitados = {}; J.recorrido = ['montania'];
        var vistos = { montania: true };
        for (var paso = 0; paso < Guion.PASOS - 1; paso++) {
          J.paso = paso;
          var mano = repartir(3);
          if (!mano.length) break;
          var k = mano[Math.floor(Math.random() * mano.length)];
          var ix = J.mazo.indexOf(k);
          if (ix !== -1) J.mazo.splice(ix, 1);
          var d = Guion.destino(k, J.lugar) || J.lugar;
          J.recorrido.push(d);
          J.visitados[d] = true;
          J.lugar = d;
          vistos[d] = true;
        }
        Object.keys(vistos).forEach(function (l) {
          cuenta[l] = (cuenta[l] || 0) + 1;
        });
      }
    } finally {
      J.mazo = guardado.mazo; J.paso = guardado.paso; J.lugar = guardado.lugar;
      J.visitados = guardado.visitados; J.recorrido = guardado.recorrido;
    }
    var tabla = Object.keys(cuenta).map(function (l) {
      return { lugar: l, porciento: Math.round(cuenta[l] / partidas * 100) };
    }).sort(function (a, b) { return a.porciento - b.porciento; });
    // La montania es el arranque y la cama el final: esas no se miden.
    var libres = tabla.filter(function (f) {
      return f.lugar !== 'montania' && f.lugar !== 'cama';
    });
    var flojos = libres.filter(function (f) { return f.porciento < 12; });
    return { partidas: partidas, tabla: tabla, flojos: flojos, ok: !flojos.length };
  };

  /* La pantalla de celular, que es donde lo va a jugar.

     Todo lo que se rompio en la tanda 6 se rompia solo en vertical y angosto:
     el nombre del lugar encima del marcador, el mazo encima del tercer naipe,
     Bel cortada por el borde. En escritorio no se veia ninguno. Esto recorre
     los 14 lugares y mide las cajas de verdad —las del DOM y las dos que el
     dibujo anota— en vez de mirar capturas.

     No cambia el tamano de la ventana: hay que ponerla en el tamano a probar
     y correrlo ahi. */
  window.verificarCelular = function () {
    var LUGARES = ['montania', 'calesita', 'arbol', 'laguna', 'luna', 'barca',
                   'ruina', 'faro', 'platillo', 'casa', 'reloj', 'puerta',
                   'bandada', 'cama'];
    var choques = [], fuera = [], huecos = [], tabla = [];

    function caja(sel) {
      var e = document.querySelector(sel);
      if (!e) return null;
      var r = e.getBoundingClientRect();
      /* Sin contenido no hay caja, y eso si es no estar. Pero la opacidad NO
         se mira: estos elementos entran y salen con una transicion de un
         segundo, y con la pestana en segundo plano esa transicion no avanza
         nunca. Filtrando por opacidad, la verificacion daba todo en verde
         porque no estaba midiendo nada. Lo que se mide aca es donde caen las
         cajas, que es lo que se pisa. */
      if (!r.width || !r.height) return null;
      return r;
    }
    function cruzan(a, b) {
      return !!a && !!b && a.left < b.right && b.left < a.right &&
             a.top < b.bottom && b.top < a.bottom;
    }

    function unLugar(i) {
      if (i >= LUGARES.length) {
        return {
          ancho: window.innerWidth, alto: window.innerHeight,
          choques: choques, fuera: fuera, huecos: huecos, tabla: tabla,
          ok: !choques.length && !fuera.length && !huecos.length
        };
      }
      var k = LUGARES[i];
      window.irA(k);
      return luegoPromesa(700).then(function () {
        var rotulo = caja('#rotulo'), marcador = caja('#marcador');
        var mazo = caja('#resto'), relato = caja('#relato');
        var cartas = [].slice.call(document.querySelectorAll('.carta'))
          .map(function (e) { return e.getBoundingClientRect(); })
          .filter(function (r) { return r.width && r.height; });

        if (cruzan(rotulo, marcador)) choques.push({ lugar: k, que: 'rotulo x marcador' });
        if (cruzan(mazo, marcador)) choques.push({ lugar: k, que: 'mazo x marcador' });
        if (cruzan(mazo, rotulo)) choques.push({ lugar: k, que: 'mazo x rotulo' });
        cartas.forEach(function (c, n) {
          if (cruzan(mazo, c)) choques.push({ lugar: k, que: 'mazo x carta ' + (n + 1) });
        });

        var b = J.belCaja, f = J.figCaja;
        if (b) {
          if (b.izq < 0) fuera.push({ lugar: k, que: 'Bel sale por la izquierda', px: +b.izq.toFixed(1) });
          /* La caja de la figura es el cuadrado de 2E, no lo que el dibujo
             llena: una montana rusa deja aire en sus esquinas. Que el hombro
             de Bel entre unos pixeles en ese cuadrado no la tapa. Se avisa
             cuando se le mete mas de medio cuerpo, que ahi si se superponen. */
          var medio = (b.der - b.izq) / 2;
          if (f && b.der > f.izq + medio) {
            fuera.push({ lugar: k, que: 'Bel encima de la figura', px: +(b.der - f.izq).toFixed(1) });
          }
        }
        /* El hueco entre el pie del relato y lo mas alto de la figura. Con un
           texto de dos renglones quedaba media pantalla vacia en el medio. */
        if (relato && f) {
          var hueco = f.techo - relato.bottom;
          tabla.push({ lugar: k, hueco: Math.round(hueco) });
          if (hueco > window.innerHeight * .30) {
            huecos.push({ lugar: k, px: Math.round(hueco) });
          }
        }
        return unLugar(i + 1);
      });
    }
    return unLugar(0);
  };

  // Una espera que se puede encadenar, y que respeta el ritmo de prueba.
  function luegoPromesa(ms) {
    return new Promise(function (listo) { luego(ms, listo); });
  }

  window.auditarTodo = function () {
    var out = {};
    /* Con Promise.resolve envolviendo cada una: verificarBases y auditar
       devuelven el objeto directo, no una promesa, y encadenarlas como si
       lo fueran rompia la auditoria entera en la primera linea. */
    return Promise.resolve(window.verificarBases()).then(function (r) { out.bases = r.ok;
    }).then(function () { return Promise.resolve(window.verificarDibujo()); }).then(function (r) { out.dibujo = r.ok;
    }).then(function () { return Promise.resolve(window.auditar()); }).then(function (r) { out.contenido = r.ok;
    }).then(function () { return Promise.resolve(window.verificarTextos()); }).then(function (r) { out.textos = r.ok;
    }).then(function () { return window.verificarRotulo(); }).then(function (r) { out.rotulo = r.desajustes === 0;
    }).then(function () { return window.verificarTramos(2); }).then(function (r) { out.tramos = r.fallos === 0;
    /* El reparto y las frecuencias entran a la auditoria y las partidas
       simuladas no: estas dos miden lo mismo mil veces mejor y en un segundo,
       porque no esperan a que nada se dibuje. verificarCelular queda afuera a
       proposito — necesita que la ventana este en el tamano a probar. */
    }).then(function () { return window.verificarReparto(40); }).then(function (r) { out.reparto = r.ok;
    }).then(function () { return window.frecuenciaLugares(300); }).then(function (r) { out.frecuencias = r.ok;
    }).then(function () {
      return window.centinelaDibujo(function () {
        ['montania','platillo','calesita','laguna','faro','casa','arbol','reloj',
         'luna','puerta','ruina','bandada','barca','cama'].forEach(function (k) {
          window.instante(k, null, { t: 2, indicios: 4 });
        });
      });
    }).then(function (r) {
      out.dibujoLimpio = r.ok;
      out.ok = Object.keys(out).every(function (k) { return out[k] === true; });
      return out;
    });
  };

  window.verificarTramos = function (cuantas) {
    cuantas = cuantas || 5;
    var mal = [], recorridos = [];

    function una(i) {
      return window.pruebaPartida({
        mirar: i % 2 === 0,
        elegir: function (j, n) { return (i + j) % n; }
      }).then(function (r) {
        recorridos.push(r.recorrido.join(' '));
        for (var paso = 0; paso < Guion.PASOS; paso++) {
          var lugar = r.recorrido[paso + 1];
          if (!lugar) { mal.push({ paso: paso, motivo: 'falta lugar' }); continue; }
          if (paso === Guion.PASOS - 1) {
            if (lugar !== 'cama') mal.push({ paso: paso, lugar: lugar, motivo: 'el ultimo no es la cama' });
            continue;
          }
          var t = Guion.tramoDe(paso);
          if (!t) { mal.push({ paso: paso, lugar: lugar, motivo: 'sin tramo' }); continue; }
          if (t.libre) {
            if (t.lugares.indexOf(lugar) === -1) {
              mal.push({ paso: paso, lugar: lugar, tramo: t.nombre, motivo: 'fuera del tramo' });
            }
          } else if (lugar !== Guion.forzado(paso)) {
            mal.push({ paso: paso, lugar: lugar, esperado: Guion.forzado(paso), motivo: 'forzado incumplido' });
          }
        }
      });
    }

    var cadena = Promise.resolve();
    for (var i = 0; i < cuantas; i++) cadena = cadena.then(una.bind(null, i));
    return cadena.then(function () {
      return { fallos: mal.length, mal: mal.slice(0, 4), recorridos: recorridos, ok: mal.length === 0 };
    });
  };

  /* Centinela de dibujo.

     Envuelve el contexto 2D y avisa cuando entra un numero que no es finito,
     un radio negativo o un save sin su restore. Esa clase de errores no rompe
     nada visible: el navegador ignora la operacion en silencio, o peor, tira
     una excepcion que mata el cuadro y deja la pantalla congelada con el
     dibujo anterior — que es exactamente lo que paso con el radio negativo del
     halo y con el eje corrido. Sin esto hay que descubrirlos mirando.

     Se instala, se corre lo que sea, y se saca. */
  var METODOS_XY = {
    arc: [0, 1, 2], arcTo: [0, 1, 2, 3, 4], ellipse: [0, 1, 2, 3],
    rect: [0, 1, 2, 3], fillRect: [0, 1, 2, 3], strokeRect: [0, 1, 2, 3],
    clearRect: [0, 1, 2, 3], moveTo: [0, 1], lineTo: [0, 1],
    quadraticCurveTo: [0, 1, 2, 3], bezierCurveTo: [0, 1, 2, 3, 4, 5],
    translate: [0, 1], scale: [0, 1], rotate: [0],
    createLinearGradient: [0, 1, 2, 3], createRadialGradient: [0, 1, 2, 3, 4, 5],
    fillText: [1, 2], strokeText: [1, 2], setTransform: [0, 1, 2, 3, 4, 5]
  };
  // Argumentos que ademas no pueden ser negativos: son radios.
  var RADIOS = { arc: [2], ellipse: [2, 3], createRadialGradient: [2, 5] };

  /* Centinela de consola: recoge todo error, warning o rechazo sin atrapar
     que ocurra mientras corre lo que sea. Un error en un callback no rompe la
     pantalla ni aparece en ningun resultado; sin esto, pasa sin que nadie se
     entere. */
  window.centinelaConsola = function (fn) {
    var caidas = [];
    var errO = console.error, warnO = console.warn;
    function onErr(e) { caidas.push({ tipo: 'error', que: String(e.message || e.reason || e) }); }
    console.error = function () { caidas.push({ tipo: 'console.error', que: [].join.call(arguments, ' ').slice(0, 140) }); return errO.apply(console, arguments); };
    console.warn = function () { caidas.push({ tipo: 'console.warn', que: [].join.call(arguments, ' ').slice(0, 140) }); return warnO.apply(console, arguments); };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onErr);
    function limpiar() {
      console.error = errO; console.warn = warnO;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
    }
    return Promise.resolve().then(fn).then(function (v) {
      // Un respiro: los errores de callbacks llegan despues del return.
      return new Promise(function (res) { setTimeout(function () { res(v); }, 260); });
    }).then(function (v) {
      limpiar();
      return { caidas: caidas, ok: caidas.length === 0, valor: v };
    }, function (e) {
      limpiar();
      caidas.push({ tipo: 'excepcion', que: String(e && e.message || e) });
      return { caidas: caidas, ok: false };
    });
  };

  window.centinelaDibujo = function (fn) {
    var alertas = [], hondo = 0, minHondo = 0;
    var originales = {};

    Object.keys(METODOS_XY).forEach(function (m) {
      if (typeof cx[m] !== 'function') return;
      originales[m] = cx[m];
      cx[m] = function () {
        var args = arguments;
        METODOS_XY[m].forEach(function (i) {
          var v = args[i];
          if (typeof v === 'number' && !isFinite(v) && alertas.length < 40) {
            alertas.push({ metodo: m, arg: i, valor: String(v) });
          }
        });
        (RADIOS[m] || []).forEach(function (i) {
          if (typeof args[i] === 'number' && args[i] < 0 && alertas.length < 40) {
            alertas.push({ metodo: m, arg: i, valor: args[i], que: 'radio negativo' });
          }
        });
        return originales[m].apply(cx, args);
      };
    });

    var saveO = cx.save, restoreO = cx.restore;
    cx.save = function () { hondo++; return saveO.apply(cx, arguments); };
    cx.restore = function () {
      hondo--;
      if (hondo < minHondo) minHondo = hondo;
      return restoreO.apply(cx, arguments);
    };

    function limpiar() {
      Object.keys(originales).forEach(function (m) { cx[m] = originales[m]; });
      cx.save = saveO; cx.restore = restoreO;
    }

    var resultado = { alertas: alertas };
    try {
      var r = fn();
      if (r && typeof r.then === 'function') {
        return r.then(function () {
          limpiar();
          resultado.saveSinRestore = hondo;
          resultado.restoreDeMas = minHondo;
          resultado.ok = !alertas.length && hondo === 0 && minHondo === 0;
          return resultado;
        });
      }
    } finally {
      if (!resultado.saveSinRestore) {
        limpiar();
        resultado.saveSinRestore = hondo;
        resultado.restoreDeMas = minHondo;
        resultado.ok = !alertas.length && hondo === 0 && minHondo === 0;
      }
    }
    return Promise.resolve(resultado);
  };

  window.auditar = function () {
    var faltan = [], sinPintor = [], sinBase = [], cartasACama = [];
    Object.keys(Guion.LUGARES).forEach(function (k) {
      var l = Guion.LUGARES[k];
      if (!Figuras.CATALOGO[k]) faltan.push('figura inexistente: ' + k);
      if (!l.nombre) faltan.push(k + ' sin nombre');
      if (!l.llegada) faltan.push(k + ' sin llegada');
      if (!l.vuelta) faltan.push(k + ' sin vuelta');
      if (!l.esconde) faltan.push(k + ' sin esconde');
      if (!l.revela || !Guion.LUGARES[l.revela]) faltan.push(k + ' revela mal: ' + l.revela);
    });
    Guion.CARTAS.forEach(function (c) {
      if (!c.accion) faltan.push('carta ' + c.clave + ' sin accion');
      if (!c.lectura) faltan.push('carta ' + c.clave + ' sin lectura');
      if (c.figura === 'cama') cartasACama.push(c.clave);
      if (!c.revela && !Guion.LUGARES[c.figura]) {
        faltan.push('carta ' + c.clave + ' apunta a ' + c.figura);
      }
    });
    Object.keys(Figuras.CATALOGO).forEach(function (k) {
      if (!Pintores.PINTORES[k] && k !== 'montania') sinPintor.push(k);
      if (!(k in BASES)) sinBase.push(k);
    });
    // Toda combinación carta x lugar tiene que dar una figura que exista.
    var combinacionesMal = [];
    Object.keys(Guion.LUGARES).forEach(function (k) {
      Guion.CARTAS.forEach(function (c) {
        var d = Guion.destino(c.clave, k);
        if (!d || !Guion.LUGARES[d]) combinacionesMal.push(c.clave + '@' + k + '->' + d);
      });
    });
    return {
      lugares: Object.keys(Guion.LUGARES).length,
      cartas: Guion.CARTAS.length,
      figuras: Object.keys(Figuras.CATALOGO).length,
      faltan: faltan, sinPintor: sinPintor, sinBase: sinBase,
      cartasACama: cartasACama, combinacionesMal: combinacionesMal,
      ok: !faltan.length && !sinPintor.length && !sinBase.length &&
          !cartasACama.length && !combinacionesMal.length
    };
  };
})();
