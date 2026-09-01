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
    if (RITMO > 1) {
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
    seguirPaso: null,       // como sigue el paso cuando termine de leerse
    guias: {},              // que avisos de la primera partida ya salieron
    errosSeguidos: 0,       // tres seguidos y la ventana se agranda
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
       que nunca llega. RITMO > 1 solo pasa en simulacion. */
    if (RITMO > 1) { luego(msLectura, fn); return; }
    var mia = ++fichaEspera;
    esperando = null;
    /* El avance no se habilita junto con el texto, sino con el aviso. Los dos
       llegan tarde a proposito: el jugador viene de tocar el anillo, y si el
       relato aceptara el toque desde el primer milisegundo, el gesto de la
       mecanica anterior se lo saltea sin que llegue a leer una palabra. */
    luego(900, function () {
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

  function actualizarRestan() {
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
    elMano.classList.remove('fuera');
    medirMano();

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
    // El aviso dice que hacer, no una palabra suelta: "mira" no le indicaba
    // a nadie que habia que tocar cuando el anillo llegara a la marca.
    mostrarAviso('tocá cuando el anillo llegue a la marca', '');
    /* Mientras las piezas vuelan, el lugar deja ver por un momento lo que
       escondia. La guia dice las dos cosas: que hay algo, y como agarrarlo. */
    guiar('anillo', 'mientras se transforma, este lugar muestra lo que esconde · tocá cuando el anillo llegue a la marca', 6400);

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

    // El texto entra cuando la transformación ya se ve — salvo que se haya
    // encontrado algo, y entonces el indicio va primero y manda el.
    luego(2400, function () {
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
    titu.textContent = 'Encontraste ' + J.indicios.length + ' de ' + Guion.PASOS;
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
    luego(900, function () { elCarta.classList.add('ver'); });
  }

  if (btnAbrir) btnAbrir.addEventListener('click', abrirCarta);
  var btnCerrar = document.getElementById('cerrarCarta');
  if (btnCerrar) btnCerrar.addEventListener('click', function () { location.reload(); });

  /* ---------- el instante ---------- */

  function mostrarAviso(texto, clase) {
    if (!elAviso) return;
    elAviso.textContent = texto;
    elAviso.className = clase + ' ver';
  }
  function ocultarAviso() {
    if (elAviso) elAviso.className = '';
  }

  function resolverMirada() {
    var r = mirada.resultado;
    if (Instante.acerto(mirada)) {
      // Lo que vio es el indicio de ESE lugar, y no se junta dos veces.
      if (J.esconde && J.indicios.indexOf(J.esconde) === -1) {
        J.indicios.push(J.esconde);
        J.vioAhora = J.esconde;
        J.tension = Math.min(1, J.indicios.length / (Guion.PASOS - 1));
        Audio2.tensar(J.tension);
        var iP = J.perdidos.indexOf(J.esconde);
        if (iP !== -1) J.perdidos.splice(iP, 1);
        // Que el marcador se mueva: si no, sumar un indicio no se siente.
        elMarcador.classList.remove('suma');
        void elMarcador.offsetWidth;
        elMarcador.classList.add('suma');
      }
      Instante.apretar();
      J.errosSeguidos = 0;
      mostrarAviso('encontraste algo que no cierra', 'bien');
      Audio2.acierto();

      /* El mundo se frena y se dice lo que este lugar escondia, con la figura
         vieja todavia delante. Antes esto se mostraba despues de la
         transformacion, cuando el lugar ya era otro: se leia el secreto de la
         luna con el arbol en pantalla y el cartel diciendo EL ARBOL. */
      if (J.vioAhora) {
        var visto = J.vioAhora;
        J.congelado = true;
        decir(visto, function () {
          J.congelado = false;
          J.vioAhora = null;
          // Lo que falte de transformacion, y despues el texto de la carta.
          luego(1300, function () { if (J.seguirPaso) J.seguirPaso(); });
        });
      }
      luego(1400, function () {
        guiar('marcador', 'eso queda anotado arriba · cuántas encuentres decide el final', 5200);
      });
    } else {
      J.errosSeguidos = (J.errosSeguidos || 0) + 1;
      /* Decir QUE se perdio. "Eso ya no lo vas a ver" hablaba de una cosa que
         el jugador nunca llego a ver, asi que no se referia a nada. */
      var textoFallo = (r === 'pronto' ? 'tocaste muy pronto' : 'se te pasó') +
                       ' — este lugar escondía algo y ya no vas a saber qué';
      // Se anota como perdido: al final se muestra cuantos fueron.
      if (J.esconde && J.indicios.indexOf(J.esconde) === -1 &&
          J.perdidos.indexOf(J.esconde) === -1) {
        J.perdidos.push(J.esconde);
      }
      // A la tercera seguida el juego afloja, y lo dice: que se note que es a
      // proposito y no que de golpe se volvio facil.
      if (J.errosSeguidos >= 3) {
        Instante.aflojar();
        J.errosSeguidos = 0;
        textoFallo += '  ·  te doy un poco más de tiempo';
      }
      mostrarAviso(textoFallo, 'mal');
      Audio2.fallo();
      luego(1400, function () {
        guiar('marcador', 'arriba se anota lo que encontrás · cuántas sean decide el final', 5200);
      });
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

  /* Devuelve si el gesto se consumio. Importa: el mismo toque sirve para el
     instante y para seguir el relato, y si las dos cosas corren con un solo
     gesto, tocar el anillo tarde tambien se lleva puesto el texto que acaba
     de aparecer — el jugador ve pasar de largo lo que iba a leer. */
  function tocarInstante() {
    // Sin instante abierto no hay nada que tocar, y uno resuelto no se toca dos
    // veces: las dos guardas juntas evitan contar un indicio de mas.
    if (!mirada.activo || mirada.resuelto) return false;
    Instante.tocar(mirada);
    resolverMirada();
    return true;
  }
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

  function cuadro(ahora, deRespaldo) {
    cuadrosDibujados++;
    /* dt nunca puede ser negativo. El respaldo por reloj y el adelanto de
       cuadros de las pruebas mueven `anterior` mas alla del tiempo real, y
       cuando despues entra un cuadro normal la resta da negativa. Con dt
       negativo, las interpolaciones del tipo v += (objetivo - v) * (1 -
       pow(k, dt)) invierten el signo del factor y en vez de acercarse al
       objetivo se alejan: asi es como la cabeza de Bel se ponia a girar
       sola, cada vez mas, sin nada que la frenara. */
    var dt = sinBucle ? 0 : Math.max(0, Math.min(.05, (ahora - anterior) / 1000));
    anterior = ahora; t += dt;

    // Si la ventana cambio de tamano, reajustar antes de dibujar nada.
    if (!sinBucle && revisarTamanio()) pintarNaipes();

    Cielo.actualizar(cielo, dt);

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

    if (J.u < 1 && !J.congelado) {
      J.u = Math.min(1, J.u + dt * .42 * RITMO);
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
    } else {
      var aSale = 1 - Math.min(1, u / .26);
      var aPiezas = Math.min(1, Math.min(u / .16, (1 - u) / .18));
      var aEntra = Math.max(0, (u - .70) / .30);

      if (aSale > .01) {
        cx.save(); cx.globalAlpha = aSale;
        Pintores.pintar(cx, J.lugar, fx, fy, E, tt, extra);
        cx.restore();
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
    var metaCalculada = Math.max(
      W * .055,                             // nunca pegada al borde del cuadro
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
    if (!sinBucle && !deRespaldo) requestAnimationFrame(cuadro);
  }
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

  /* ---------- sonido ---------- */

  var elSonido = document.getElementById('sonido');
  var elSonidoIcono = document.getElementById('sonidoIcono');
  function pintarSonido() {
    var on = Audio2.activo();
    elSonido.setAttribute('aria-pressed', on ? 'true' : 'false');
    elSonidoIcono.textContent = on ? '♫' : '♪';
    elSonido.title = on ? 'Silenciar' : 'Con sonido';
  }
  elSonido.addEventListener('click', function () {
    Audio2.alternar();
    pintarSonido();
  });

  var elVol = document.getElementById('vol');
  elVol.addEventListener('input', function () {
    var v = elVol.value / 100;
    // Mover el volumen desde cero tambien prende el sonido: si no, el control
    // parece roto.
    if (v > 0 && !Audio2.activo()) { Audio2.prender(); pintarSonido(); }
    Audio2.ponerVolumen(v);
  });
  document.getElementById('empezar').addEventListener('click', function () {
    // El primer gesto del usuario es la única oportunidad de arrancar el audio.
    Audio2.prender();
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
    if (!mirada.activo || mirada.resuelto) return 'no habia instante activo';
    mirada.resuelto = true;
    mirada.resultado = acierta ? 'clavado' : 'tarde';
    if (acierta) mirada.destello = 1; else mirada.fallo = 1;
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
        if (pruebaEnCurso === reloj) pruebaEnCurso = null;
        RITMO = RITMO_NORMAL;
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
