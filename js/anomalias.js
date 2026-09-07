/* Lo que cada lugar esconde, dibujado.

   Hasta ahora la anomalía era solamente un texto: acertabas el instante, el
   mundo se frenaba y aparecía un párrafo. La recompensa por mirar era leer, en
   un juego que se trata de mirar. Acá cada lugar tiene, además del texto, algo
   que OCURRE en pantalla — y el texto pasa a nombrar lo que se está viendo en
   vez de reemplazarlo.

   Cada anomalía recibe `v`, de 0 a 1, que es cuánto se reveló: entra sola
   mientras el texto está a la vista y se va cuando el mundo se destraba. Todas
   se dibujan encima de la figura ya pintada, así que trabajan por agregado y
   nunca la borran.

   Regla para agregar una: tiene que poder entenderse SIN leer el texto. Si hace
   falta el párrafo para saber qué está pasando, la anomalía no está dibujada,
   está ilustrada. */
var Anomalias = (function () {
  'use strict';

  /* Curva de entrada: aparece rápido y se queda. Las anomalías son el premio,
     no tienen que hacerse esperar. */
  function entra(v) { return Math.min(1, v * 1.6); }

  /* El mismo ruido con semilla que usa pintores.js. Va repetido y no
     importado porque cada modulo es un IIFE cerrado y no se ven entre si;
     copiar seis lineas es mas barato que abrir uno de los dos. Lo que importa
     es que sea SIEMPRE el mismo desorden: con Math.random, lo que se dibuja
     cambia en cada cuadro y lo que era un aire lleno de cosas pasa a ser
     ruido de television. */
  function sembrado(n) {
    var x = n * 9301 + 49297;
    return function () {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  }

  /* Un halo suave, para marcar sin dibujar un borde. */
  function halo(cx, x, y, r, color, alfa) {
    var g = cx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
    g.addColorStop(0, 'rgba(' + color + ',' + alfa.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + color + ',0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(x, y, Math.max(1, r), 0, 6.2832); cx.fill();
  }

  /* Una silueta de mujer, de lejos y a contraluz. (x, y) es donde apoya los
     pies y `alto` lo que mide de pies a cabeza.

     Proporciones de figurin, las mismas que Bel: la cabeza entra unas ocho
     veces en el alto. Con una cabeza mas grande —entraba cinco— y el pelo
     ancho, la silueta dejaba de leerse como una mujer a lo lejos y se leia
     como un bicho. Todo lo que la hace mujer son tres cosas finas: el pelo
     cayendo por fuera de los hombros, la cintura, y que el vestido se abra
     apenas abajo. Cara no tiene ni puede tener: a contraluz nadie tiene cara.

     Va en tinta translucida y no en negro pleno: es una persona vista contra
     una lampara, no un recorte pegado encima del vidrio. */
  /* `tinta` es cuanto se marca: 1 es un recorte lleno, y por debajo de eso
     una sombra que hay que buscar. El hueco del agua necesita leerse —es una
     ausencia, y una ausencia que no se ve no es nada—; la del faro no, porque
     es alguien lejos en una ventana iluminada y ahi lo justo es entrever. */
  function silueta(cx, x, y, alto, alfa, sinLuz, tinta) {
    if (!(alfa > .01)) return;
    var A = alto;
    var T = (tinta === undefined) ? 1 : tinta;
    cx.save();
    /* La luz que la recorta, apenas mas viva justo detras de ella. En el agua
       no va: ahi la silueta no es alguien a contraluz sino el hueco de un
       reflejo, y un halo calido debajo del agua no lo hace nadie. */
    if (!sinLuz) halo(cx, x, y - A * .55, A * 1.05, '255,240,205', .26 * alfa * T);

    /* TODO el cuerpo es UN SOLO trazo con un solo relleno.

       Dibujado como formas sueltas —vestido, torso, cuello, cabeza, pelo—, con
       tinta translucida cada superposicion sumaba opacidad: donde el pelo
       cruzaba la cabeza quedaba un parche oscuro y donde no, uno claro, y esos
       parches dibujaban una cara. Aparecian dos ojos y dos cuernos sin que
       nadie los hubiera dibujado. Con un unico fill las subrutas se funden y
       la silueta queda pareja, que es lo unico que una silueta tiene que ser. */
    cx.fillStyle = 'rgba(16,12,22,' + (.82 * alfa * T).toFixed(3) + ')';
    cx.beginPath();

    /* Vestido: sale de la cintura y se abre en campana. La medida es lo unico
       que decide si esto se lee como una mujer o como un poste: abierto a un
       cuarto del alto era un bicho, cerrado a un decimo un alfil de ajedrez. */
    cx.moveTo(x - A * .052, y - A * .630);
    cx.lineTo(x + A * .052, y - A * .630);
    cx.quadraticCurveTo(x + A * .085, y - A * .34, x + A * .155, y);
    cx.lineTo(x - A * .155, y);
    cx.quadraticCurveTo(x - A * .085, y - A * .34, x - A * .052, y - A * .630);
    cx.closePath();

    // Torso, cuello y cabeza, de un tiron: hombros caidos, cintura, y el
    // cuello ancho para que no quede ni una rendija entre la cara y el pelo.
    cx.moveTo(x - A * .052, y - A * .615);
    cx.quadraticCurveTo(x - A * .042, y - A * .73, x - A * .078, y - A * .840);
    cx.quadraticCurveTo(x - A * .052, y - A * .900, x - A * .050, y - A * .915);
    cx.lineTo(x + A * .050, y - A * .915);
    cx.quadraticCurveTo(x + A * .052, y - A * .900, x + A * .078, y - A * .840);
    cx.quadraticCurveTo(x + A * .042, y - A * .73, x + A * .052, y - A * .615);
    cx.closePath();

    // Cabeza. El moveTo antes del arco evita que se enganche con la subruta
    // anterior y le salga una linea cruzando el cuello.
    cx.moveTo(x + A * .062, y - A * .928);
    cx.arc(x, y - A * .928, A * .062, 0, 6.2832);
    cx.closePath();

    // Pelo: dos caidas finas por fuera de los hombros, que pasan la cintura.
    /* El de la izquierda va escrito al reves que el de la derecha, a
       proposito. Espejarlo punto por punto le da la orientacion contraria, y
       con un unico relleno (regla nonzero) una subruta al reves no suma: RESTA.
       Quedaba un agujero con forma de perfil justo donde iria la cara. */
    cx.moveTo(x - A * .030, y - A * .920);
    cx.lineTo(x - A * .048, y - A * .655);
    cx.lineTo(x - A * .092, y - A * .625);
    cx.quadraticCurveTo(x - A * .112, y - A * .85, x - A * .050, y - A * .952);
    cx.closePath();
    cx.moveTo(x + A * .050, y - A * .952);
    cx.quadraticCurveTo(x + A * .112, y - A * .85, x + A * .092, y - A * .625);
    cx.lineTo(x + A * .048, y - A * .655);
    cx.lineTo(x + A * .030, y - A * .920);
    cx.closePath();

    cx.fill();
    cx.restore();
  }

  var PINTA = {

    /* Las vías se cortan en el aire. Se dibuja el corte: dos puntas que se
       apagan en la nada, con el aire temblando alrededor de donde deberían
       seguir. */
    /* Las vias se cortan, y el corte lo hace el pintor: el ultimo tramo se
       adelgaza y desaparece con sus vigas. Aca queda el aire donde estaba, que
       es lo unico que se puede dibujar de algo que ya no esta.

       Se probaron las dos maneras de dibujar lo que falta y las dos fallaban.
       Una linea punteada que sigue: el ojo lee una estela cayendo, una
       estrella fugaz. Una via fantasma que sube: quedaban dos vias, la real y
       otra flotando al lado, y ademas contradecia el texto — si el tramo que
       falta se dibuja, deja de faltar. */
    montania: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      var pts = (typeof Figuras !== 'undefined' && Figuras.perfilMontania())
        ? Figuras.perfilMontania() : null;
      /* Donde la via se corta AHORA, no donde terminaba antes.

         Esto apuntaba al ultimo punto del perfil, que es el final de la via
         entera y esta abajo, casi en el piso. Desde que el corte se deshace
         hasta la ultima cresta, ese punto quedo ocho tramos mas alla del corte
         real: el aire temblaba en un lugar donde ya no hay nada, y donde la
         via se termina de verdad no pasaba nada. La cuenta es la misma que la
         del pintor —el .31 tiene que moverse con el de alla. */
      var corte = pts
        ? Math.max(1, pts.length - 1 - Math.round(a * (pts.length - 1) * .31) - 1)
        : 0;
      var ult = pts ? pts[corte] : [1, .55];
      var px = fx + E * ult[0], py = fy + E * ult[1];
      cx.save();
      // El aire tiembla donde la via dejo de existir.
      halo(cx, px, py, E * (.26 + .05 * Math.sin(t * 1.6)), '214,222,255', .14 * a);
      cx.restore();
    },

    /* La luz baja del todo, como quien asiente. El apagon lo hace el pintor
       —apagar una luz es dejar de dibujarla— y aca queda el asentir: la cupula
       se enciende una vez, despacio, y se apaga. Sin eso la anomalia seria
       apagar una luz, que no se lee como respuesta. */
    platillo: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      var pulso = Math.max(0, Math.sin(a * Math.PI));
      cx.save();
      halo(cx, fx, fy - E * .10, E * (.7 + .5 * pulso), '190,235,255', .34 * pulso);
      cx.fillStyle = 'rgba(226,244,255,' + (.55 * pulso).toFixed(3) + ')';
      cx.beginPath();
      cx.ellipse(fx, fy - E * .12, E * .22, E * .11, 0, Math.PI, 6.2832);
      cx.fill();
      cx.restore();
    },

    /* La calesita no esta apoyada. La figura sube sola —eso lo hace el
       dibujo, no esto— y aca va lo que cuenta que esta en el aire: la sombra
       que se despega del piso y se aclara, y las luces del borde dando la
       vuelta entera para el mismo lado, que es lo que no hace ninguna
       calesita. No se convierte en nada. Cuando soltas, apoya.

       Antes lo que escondia era la musica que le llegaba de todos lados, y se
       dibujaba con ondas concentricas: era la segunda anomalia menos visible
       de las catorce (1.696 pixeles contra los 42.793 del platillo) en un
       juego que se trata de mirar. La frase se mudo al texto de llegada. */
    calesita: function (cx, fx, fy, E, t, v, extra, W, H, belX, piso) {
      var a = entra(v);
      var suelo = (piso !== undefined) ? piso : fy + E;

      /* La sombra: mas chica cuanto mas alto esta, y con el borde desvanecido.
         En negro plano quedaba una elipse dura pegada al piso, que se leia
         como una mancha y no como una sombra. */
      cx.save();
      cx.globalAlpha = .85 * a;
      cx.translate(fx, suelo + 2);
      cx.scale(1, .11);
      var rs = E * (.62 - a * .10);
      var gs = cx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, rs));
      /* Casi toda opaca y desvanecida solo en el borde. Con el degrade repartido
         de punta a punta la sombra desaparecia: es negro sobre un fondo que ya
         es casi negro, y lo unico que la hace existir es el contraste con el
         suelo. Sin sombra, la calesita no se lee levantada, se lee mas alta. */
      gs.addColorStop(0, 'rgba(0,0,0,1)');
      gs.addColorStop(.74, 'rgba(0,0,0,.90)');
      gs.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = gs;
      cx.beginPath(); cx.arc(0, 0, Math.max(1, rs), 0, 6.2832); cx.fill();
      cx.restore();

      // Las luces del borde, girando parejas.
      cx.save();
      for (var i = 0; i < 12; i++) {
        var ang = t * 1.5 + i / 12 * 6.2832;
        var lx = fx + Math.cos(ang) * E * .74;
        var ly = fy + E * .52 + Math.sin(ang) * E * .13;
        var frente = (Math.sin(ang) + 1) / 2;
        cx.globalAlpha = a * (.20 + frente * .75);
        halo(cx, lx, ly, E * .085, '210,230,255', .9);
        cx.fillStyle = 'rgba(236,246,255,.95)';
        cx.beginPath(); cx.arc(lx, ly, E * .022, 0, 6.2832); cx.fill();
      }
      cx.restore();
    },

    /* El agua devuelve todo menos a ella: en el reflejo hay un hueco con su
       forma. Se dibuja el hueco, no la figura. */
    laguna: function (cx, fx, fy, E, t, v, extra, W, H, belX, piso) {
      var a = entra(v);
      if (belX === undefined) return;

      /* El agua devuelve todo menos a ella.

         Dibujar la ausencia no funciona, y se probo dos veces: primero un
         ovalo negro —"no le veo sentido que este ahi"— y despues una silueta
         humana achatada, que se leyo como un peon de ajedrez. El error es el
         mismo de las vias: si se dibuja algo, hay algo. Una mancha en el agua
         es una cosa flotando, nunca el lugar donde falta un reflejo.

         Asi que no se dibuja el hueco: se dibuja el VECINDARIO. Una fila de
         juncos a lo largo de la orilla con su reflejo bien visible cayendo
         hacia el frente, y justo enfrente de ella la fila se interrumpe. El
         hueco lo define lo que tiene al lado, que es como se percibe
         cualquier falta — nadie ve un diente que no esta, ve los de al lado.

         Y va enfrente de ella de verdad: ella esta parada casi al borde del
         agua, y antes esto caia en el medio del charco, sin relacion con
         donde estaba. Un reflejo que no sale de nadie no es de nadie. */
      /* La geometria del agua, que es un trapecio en escorzo y no un
         rectangulo: arriba (al fondo) mide .32E de medio ancho y adelante
         1,7E. Poner la fila de juncos en linea recta los dejaba casi todos
         fuera del agua — medido, 3 pixeles tocando de 75. */
      function semi(y) { return .32 + (y - .28) / .72 * 1.38; }
      var filaY = .78, semiFila = semi(filaY);            // 1,28E de medio ancho
      var borde = E * (semiFila - .06);

      /* El claro va del lado de ella, pero adentro del agua y no pegado al
         borde. Pegado al borde no se leia: ahi el agua ya se termina, y un
         hueco en el extremo de algo es simplemente donde ese algo se acaba.
         Adentro queda rodeado de reflejos por los dos lados, y una falta solo
         se percibe por lo que tiene alrededor. */
      var lado = (belX - fx) < 0 ? -1 : 1;
      var claro = E * .34;
      var bx = fx + lado * borde * .52;

      cx.save();
      cx.globalAlpha = a;

      /* Los juncos de la orilla y lo que el agua hace con ellos. El tallo sale
         de la superficie y el reflejo cae hacia el frente —para abajo, que es
         donde cae cuando el agua se ve en escorzo— mas corto, mas tenue y
         temblando, que es todo lo que distingue a un reflejo de la cosa. */
      var paso = E * .245;
      for (var jx = fx - borde; jx <= fx + borde + 1; jx += paso) {
        if (Math.abs(jx - bx) < claro) continue;          // el lugar de ella, vacio
        var n = Math.round((jx - fx + borde) / paso);
        var supY = fy + E * filaY;
        var alto = E * (.15 + ((n * 5) % 7) * .026);
        var mece = Math.sin(t * .8 + n) * E * .018;

        cx.strokeStyle = 'rgba(126,158,124,' + (.72 * a).toFixed(3) + ')';
        cx.lineWidth = Math.max(1, E * .014);
        cx.beginPath();
        cx.moveTo(jx, supY);
        cx.quadraticCurveTo(jx + mece, supY - alto * .55, jx + mece * 2, supY - alto);
        cx.stroke();

        cx.strokeStyle = 'rgba(158,200,255,' + (.52 * a).toFixed(3) + ')';
        cx.lineWidth = Math.max(1, E * .011);
        cx.beginPath();
        cx.moveTo(jx, supY);
        cx.quadraticCurveTo(jx - mece, supY + alto * .40, jx - mece * 2, supY + alto * .70);
        cx.stroke();
      }

      /* El testigo: un junco solo, mas alto y mas claro que los otros, pegado
         al hueco por el lado de adentro.

         Sin el, la fila entera se lee como una cerca con un espacio, y un
         espacio en una cerca no es la falta de nadie. Con el, hay dos cosas
         paradas una al lado de la otra en la misma orilla: de una el agua
         devuelve todo, y del pedazo de al lado no devuelve nada. La
         comparacion es inmediata y no hace falta el parrafo para verla. */
      var supBel = fy + E * filaY;
      var tx = bx - lado * claro * .92;
      var tAlto = E * .295, tMece = Math.sin(t * .8) * E * .02;
      cx.strokeStyle = 'rgba(150,186,146,' + (.92 * a).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * .017);
      cx.beginPath();
      cx.moveTo(tx, supBel);
      cx.quadraticCurveTo(tx + tMece, supBel - tAlto * .55,
                          tx + tMece * 2, supBel - tAlto);
      cx.stroke();
      cx.strokeStyle = 'rgba(176,214,255,' + (.72 * a).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * .014);
      cx.beginPath();
      cx.moveTo(tx, supBel);
      cx.quadraticCurveTo(tx - tMece, supBel + tAlto * .40,
                          tx - tMece * 2, supBel + tAlto * .72);
      cx.stroke();

      /* Y en el claro, el agua sigue siendo agua: se le deja el brillo de la
         superficie y unas ondas, para que no se lea como un pozo ni como un
         recorte. Lo que falta ahi no es el agua: es lo que el agua tendria que
         estar devolviendo. */
      halo(cx, bx, supBel + E * .06, claro * .80, '150,190,255', .10 * a);
      cx.strokeStyle = 'rgba(150,190,255,' + (.26 * a).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * .008);
      for (var o = 0; o < 3; o++) {
        var oy = supBel + E * (.07 + o * .075);
        cx.beginPath();
        cx.moveTo(bx - claro * .66, oy);
        cx.quadraticCurveTo(bx, oy + E * .014, bx + claro * .66, oy);
        cx.stroke();
      }

      cx.restore();
    },
    /* El haz frena sobre ella. Deja de barrer y se queda.

       Frenarlo lo hace el PINTOR —`mira` en pintores.js— porque el faro tiene
       una sola lampara. Aca estaba dibujado un segundo cono, fijo, desde la
       linterna hasta ella, mientras el del pintor seguia dando la vuelta: dos
       luces saliendo del mismo farol, que es justo lo que Nico vio. Lo que
       queda aca es lo que NO es el haz: donde la luz apoya, y quien la manda. */
    faro: function (cx, fx, fy, E, t, v, extra, W, H, belX, piso) {
      var a = entra(v);
      if (belX === undefined) return;
      var ox = fx - E * .04;
      cx.save();
      cx.globalAlpha = a;
      /* La quietud: el haz no tiembla, late apenas. Corrido para el mismo
         lado que el eje del cono y bastante mas tenue: un charco de luz
         centrado justo en sus pies es la manera mas directa de decir que la
         estan iluminando a ella, y esto tiene que insinuarse. */
      halo(cx, belX + E * .13, piso - E * .30,
           E * (.40 + .04 * Math.sin(t * 1.4)), '255,240,205', .065 * a);
      cx.restore();

      /* Y arriba, en la linterna, hay alguien.

         El texto ya lo decia sin decirlo: "no esta barriendo el campo, me esta
         buscando a mi... como quien se queda mas tranquilo sabiendo donde
         estoy". Esto es solamente mostrar QUIEN. Una silueta de mujer, lejos,
         quieta, mirando para abajo — no saluda, no se mueve, no se acerca. El
         que la reconozca la va a reconocer; el que no, ve una figura en un
         faro. Esa es toda la regla del juego con lo que no se nombra. */
      /* Apoyada en el piso de la linterna, que es el rectangulo iluminado y no
         donde nace el haz: medida contra el origen del haz quedaba parada
         arriba de la cupula, como una antena. */
      /* Mas chica, mucho menos marcada, y llega ultima.

         Estaba dibujada casi negra sobre el vidrio encendido, que es el maximo
         contraste que existe en toda la pantalla: no se entreveia a nadie, se
         leia una figura recortada, y de una. Ahora es una sombra adentro de la
         luz. Y entra al final de la revelacion —`a` al cubo— para que primero
         se vea lo del haz y recien despues, si se queda mirando, esto. El que
         la reconozca la va a reconocer; el que no, ve una ventana prendida.

         Y corrida del centro del vidrio: centrada exacto se leia como un icono
         puesto ahi a proposito. Descentrada es alguien que esta parado. */
      silueta(cx, ox - E * .038, fy - E * .455, E * .158, a * a * a, false, .34);
    },

    /* Lo que se llena el aire, y el corazon.

       Lo que cambian los colores y el latido del suelo lo hace el PINTOR, con
       `hondo`: no es algo que aparezca encima, es como se ve todo, y eso solo
       lo puede hacer quien lo dibuja. Aca queda lo que si aparece — cosas en
       el aire que nunca se terminan de ver, y el pulso en las orejas.

       Y `v` no entra derecho: entra por un arco. En la mitad de la revelacion
       esta en lo peor y al final ya bajo, asi que el que se queda hasta el
       final es el unico que llega a verlo aflojar. El que suelta antes se
       queda con lo peor puesto — que es exactamente lo que pasa. */
    circulo: function (cx, fx, fy, E, t, v, extra, W, H, belX, piso) {
      var a = entra(v);
      var arco = Math.sin(Math.max(0, Math.min(1, v)) * Math.PI);
      if (arco < .01) return;
      var cy = fy + E * .70;

      cx.save();

      /* Las cosas que no se terminan de ver: aparecen fuera del centro de la
         mirada, duran poco y se van antes de que uno alcance a girar la
         cabeza. Por eso son cortas y por eso ninguna se queda quieta. */
      var rnd = sembrado(97);
      for (var i = 0; i < 22; i++) {
        var base = rnd(), fase = rnd(), giro = rnd();
        var vida = ((t * (.5 + base * .5) + fase) % 1);
        var vive = Math.sin(vida * Math.PI);
        if (vive < .05) continue;
        var ang = fase * 6.2832 + t * (.2 + giro * .3);
        var rad = E * (.55 + base * .85);
        var px = fx + Math.cos(ang) * rad;
        var py = cy - E * .30 - Math.sin(ang) * rad * .42 - vida * E * .30;
        var tam = E * (.020 + base * .028) * vive;
        var tono = Math.round((giro * 360 + t * 40) % 360);
        cx.globalAlpha = a * arco * vive * .40;
        /* Apagados y desparejos entre si. Saturados quedaban confeti: lo que
           inquieta de las cosas que uno no llega a ver no es que sean vivas,
           es que no combinan con nada de lo que hay alrededor. */
        cx.strokeStyle = 'hsl(' + tono + ',42%,58%)';
        cx.lineWidth = Math.max(1, E * .008);
        cx.beginPath();
        cx.arc(px, py, tam, ang, ang + 2.4 + giro * 2);
        cx.stroke();
      }

      /* El pulso. Se acelera con el arco y se calma con el: es el unico dato
         del cuerpo que entra en el dibujo, y va en el aire alrededor de ella
         porque es donde se escucha un corazon que golpea en las orejas. */
      cx.globalAlpha = 1;
      var bpm = 1.15 + arco * 1.75;
      var golpe = Math.pow(Math.max(0, Math.sin(t * bpm * 3.14159)), 8);
      if (belX !== undefined) {
        halo(cx, belX, piso - E * .34,
             E * (.30 + golpe * .16 + arco * .10),
             '240,140,150', .10 * a * arco * (.45 + golpe * .55));
      }
      // Y el aire del circulo entero late con el.
      halo(cx, fx, cy - E * .12, E * (1.05 + golpe * .10),
           '150,130,196', .055 * a * arco * (.5 + golpe * .5));

      cx.restore();
    },

    /* Las ventanas están prendidas y adentro no hay nada que las prenda. */
    casa: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      /* Sobre las ventanas de verdad, y del tamaño de las ventanas de verdad.

         Estaba dibujando dos cuadraditos en x = mas y menos .17E, y las
         ventanas del pintor estan en -.46E y +.30E: nunca coincidieron con
         ninguna. Lo que se veia eran dos ventanitas de mas, una en el medio de
         la pared y otra montada arriba de la ventana derecha. Es el mismo
         error de familia que las vias, la soga de la barca y el reflejo de la
         laguna — una anomalia ubicada a ojo con fracciones fijas de E, suelta
         de la figura que dice estar tocando. `verificarUbicacion` no lo agarra
         porque la casa es grande y los cuadraditos caian encima igual: pegado
         no es lo mismo que en su lugar.

         Ojo: estas medidas estan escritas en los dos archivos. Si el pintor
         mueve las ventanas, esto se mueve con el. */
      var VENTANAS = [[-.46, -.16], [.30, -.16]];
      var ANCHO = .17, ALTO = .19;                 // medias, como en el pintor
      cx.save();
      cx.globalAlpha = a;
      VENTANAS.forEach(function (p) {
        var vx = fx + E * p[0], vy = fy + E * p[1];
        /* La luz sale del vidrio y el interior queda a oscuras: se apaga el
           vidrio entero desde adentro y se deja el marco encendido, que es lo
           que el texto dice — "estan prendidas pero adentro no hay lamparas". */
        halo(cx, vx, vy, E * .40, '255,226,170', .26 * a);
        cx.fillStyle = 'rgba(12,10,18,' + (.62 * a).toFixed(3) + ')';
        cx.fillRect(vx - E * ANCHO, vy - E * ALTO, E * ANCHO * 2, E * ALTO * 2);
        cx.strokeStyle = 'rgba(255,232,180,' + (.80 * a).toFixed(3) + ')';
        cx.lineWidth = Math.max(1, E * .014);
        cx.strokeRect(vx - E * ANCHO, vy - E * ALTO, E * ANCHO * 2, E * ALTO * 2);
        // Y los travesaños, para que se siga leyendo como ventana apagada.
        cx.lineWidth = Math.max(1, E * .010);
        cx.beginPath();
        cx.moveTo(vx, vy - E * ALTO); cx.lineTo(vx, vy + E * ALTO);
        cx.moveTo(vx - E * ANCHO, vy); cx.lineTo(vx + E * ANCHO, vy);
        cx.stroke();
      });
      cx.restore();
    },

    /* El pájaro de un color que no existe. Se posa, se queda, y se va. */
    arbol: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      /* Arriba y al costado de la copa, donde hay cielo detras. Medido: en el
         medio del follaje el pajaro cae entre las ramas y no se distingue,
         aunque en una lamina aislada se viera perfecto. */
      /* A la altura de la copa y bien a la derecha, NO por encima del arbol:
         el panel del texto es HTML sobre el canvas y ocupa la franja de
         arriba, justo cuando este pajaro se muestra. Puesto mas alto queda
         detras del panel y no se ve nunca — paso, y el texto decia "yo lo vi"
         con el cielo vacio. */
      var px = fx + E * .74, py = fy - E * .88;
      /* Cuando dejas de mirar, se va: la ida es el (1 - a) — levanta vuelo
         hacia arriba y afuera en vez de desvanecerse en la rama. Mientras lo
         mires, se queda. Es literalmente lo que dice el texto. */
      px += (1 - a) * E * .55;
      py -= (1 - a) * E * .70;
      /* El color que no existe. No es uno fijo: gira por el violeta, el verde
         y el rojo mientras el pajaro esta posado. Un color que no existe no
         puede ser uno del circulo — es uno que no se queda quieto, y ademas
         asi se ve desde lejos, que es lo que hacia falta contra el follaje. */
      /* Despacio: a 52 grados por segundo parpadeaba como una luz de fiesta
         y dejaba de leerse como un color. */
      var giro = (t * 26) % 360;
      var luz = function (desfase, cl) {
        var h = (giro + desfase) % 360, c = (1 - Math.abs(2 * cl - 1)) * .92;
        var x2 = c * (1 - Math.abs((h / 60) % 2 - 1)), m = cl - c / 2;
        var q = h < 60 ? [c, x2, 0] : h < 120 ? [x2, c, 0] : h < 180 ? [0, c, x2]
              : h < 240 ? [0, x2, c] : h < 300 ? [x2, 0, c] : [c, 0, x2];
        return [Math.round((q[0] + m) * 255), Math.round((q[1] + m) * 255),
                Math.round((q[2] + m) * 255)];
      };
      var cuerpo = luz(0, .62), ala = luz(140, .58);

      cx.save();
      cx.globalAlpha = a;
      /* El halo va primero y manda: mide varias veces el cuerpo, asi que
         achicar el pajaro sin achicarlo a el no cambia el tamaño que se
         percibe — que fue lo que paso la vez pasada. */
      halo(cx, px, py, E * .165, cuerpo.join(','), .50 * a);
      /* Cuerpo: dos curvas y una cola. Chico y nitido, para que se lea — y
         mas chico desde que Nico lo vio en el juego: un pajaro que se posa un
         segundo en la punta de una rama es un detalle, y al tamaño anterior
         competia con el arbol. Lo que lo hace visible no es el tamaño sino
         que el color no se queda quieto. */
      var r = E * .052;
      cx.fillStyle = 'rgba(' + cuerpo.join(',') + ',.95)';
      cx.beginPath();
      cx.ellipse(px, py, r * 1.25, r * .85, -.2, 0, 6.2832);
      cx.fill();
      cx.beginPath();
      cx.arc(px + r * 1.05, py - r * .55, r * .52, 0, 6.2832);
      cx.fill();
      // La cola, levantada. Va en el otro extremo del giro: dos tonos lejanos
      // conviviendo es lo que lo hace llamativo de verdad.
      cx.fillStyle = 'rgba(' + ala.join(',') + ',.95)';
      cx.beginPath();
      cx.moveTo(px - r * 1.1, py + r * .1);
      cx.lineTo(px - r * 2.4, py - r * .75);
      cx.lineTo(px - r * 1.0, py + r * .55);
      cx.closePath(); cx.fill();
      // El ojo, que es lo que lo vuelve un pajaro y no una mancha.
      cx.fillStyle = 'rgba(10,26,22,.9)';
      cx.beginPath();
      cx.arc(px + r * 1.22, py - r * .66, r * .16, 0, 6.2832);
      cx.fill();
      cx.restore();
    },

    /* Los números están, se ven, y no dicen nada: se corren de su lugar. */
    reloj: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      cx.globalAlpha = a;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.font = '600 ' + Math.round(E * .145) + 'px Georgia,serif';
      for (var i = 0; i < 12; i++) {
        // Cada numero se desplaza de su hora, distinto y sin ritmo comun.
        var base = (i / 12) * 6.2832 - Math.PI / 2;
        var corre = Math.sin(t * .6 + i * 2.1) * .30 * a;
        var ang = base + corre;
        var rr = E * .40 * (1 + Math.sin(t * .4 + i) * .05 * a);
        var nx = fx + Math.cos(ang) * rr, ny = fy + Math.sin(ang) * rr;
        /* Un fantasma del numero en su hora correcta, debajo: se ve que se
           corrio de donde tenia que estar y no que el reloj se dibujo mal. */
        cx.fillStyle = 'rgba(58,44,30,' + (.16 * a).toFixed(3) + ')';
        cx.fillText(String(i === 0 ? 12 : i),
                    fx + Math.cos(base) * E * .40, fy + Math.sin(base) * E * .40);
        cx.fillStyle = 'rgba(48,36,24,' + (.60 + .35 * a).toFixed(3) + ')';
        cx.fillText(String(i === 0 ? 12 : i), nx, ny);
      }
      cx.restore();
    },

    /* Los cráteres se acomodan como una cara que está por decir algo. */
    luna: function (cx, fx, fy, E, t, v, extra, W, H, belX) {
      /* Los crateres se acomodan y sugieren una cara — pero NO una sonrisa.
         Con la boca curva quedaba un emoji, y el texto dice "una cara que esta
         por decir algo y todavia busca por donde empezar": eso es una boca
         entreabierta y despareja, no contenta. */
      var a = entra(v);

      /* Y la cara se gira hacia ella. El texto termina en "se queda
         mirandome", y hasta ahora la cara miraba al frente: decia una cosa y
         mostraba otra.

         Girar una cara en un dibujo plano son dos movimientos juntos, y con
         uno solo no se lee: los rasgos se corren hacia el lado al que mira, y
         ademas se juntan entre si, porque de perfil la cara ocupa menos ancho.
         Solo corridos parece que se le desacomodo la cara; solo juntos, que se
         achico. Los dos a la vez es un giro.

         Tarda en llegar —el giro va con `a` al cuadrado— porque el parrafo
         dice que busca por donde empezar. Primero aparece la cara y despues
         encuentra a quien mirar. */
      var lado = (belX === undefined) ? 0
        : Math.max(-1, Math.min(1, (belX - fx) / (E * 1.5)));
      var gira = lado * a * a;

      cx.save();
      cx.globalAlpha = a * .8;
      cx.fillStyle = 'rgba(116,120,146,.5)';
      cx.translate(fx + E * .085 * gira, fy);
      cx.scale(1 - Math.abs(gira) * .16, 1);
      cx.translate(-fx, -fy);
      /* Dos ojos, a distinta altura: la asimetria es lo que la vuelve una cara
         y no un dibujo. El del lado hacia el que mira se agranda un poco y el
         otro se achica, que es lo que pasa cuando una cara se gira. */
      [[-.30, -.22, .105], [.28, -.16, .085]].forEach(function (o, i) {
        var suyo = (i === 0 ? -1 : 1);
        var cerca = 1 + gira * suyo * .16;
        var x = fx + E * o[0] * (1 + (1 - a) * .9);
        var y = fy + E * o[1] * (1 + (1 - a) * .9);
        cx.beginPath(); cx.arc(x, y, E * o[2] * cerca, 0, 6.2832); cx.fill();
      });
      // La boca: entreabierta, casi recta, corrida del centro.
      var abre = E * (.035 + .006 * Math.sin(t * 1.3)) * a;
      cx.beginPath();
      cx.ellipse(fx - E * .02, fy + E * .20, E * .19, Math.max(.5, abre),
                 -.06, 0, 6.2832);
      cx.fill();
      cx.restore();
    },

    /* La abre y del otro lado hay una habitación que antes no estaba. */
    puerta: function (cx, fx, fy, E, t, v) {
      /* Del otro lado hay una habitacion. Un rectangulo iluminado no alcanza:
         hace falta que se lea el fondo, o sea una pared y un piso. */
      var a = entra(v);
      var an = E * .22, alto = E * .62;
      var x0 = fx - an * .5, y0 = fy - alto * .40;
      cx.save();
      cx.globalAlpha = a;
      // La pared del fondo.
      cx.fillStyle = 'rgba(46,34,26,.92)';
      cx.fillRect(x0, y0, an, alto);
      // El piso, en perspectiva.
      cx.fillStyle = 'rgba(74,52,34,.92)';
      cx.beginPath();
      cx.moveTo(x0, y0 + alto);
      cx.lineTo(x0 + an, y0 + alto);
      cx.lineTo(x0 + an * .82, y0 + alto * .70);
      cx.lineTo(x0 + an * .18, y0 + alto * .70);
      cx.closePath(); cx.fill();
      // Una lampara encendida contra la pared: es lo que la vuelve habitacion.
      halo(cx, x0 + an * .68, y0 + alto * .30, E * .16, '255,222,160', .55 * a);
      cx.fillStyle = 'rgba(255,232,180,' + (.85 * a).toFixed(3) + ')';
      cx.beginPath();
      cx.arc(x0 + an * .68, y0 + alto * .30, E * .022, 0, 6.2832);
      cx.fill();
      // Y el marco, para que se lea que es lo de adentro y no un cuadro.
      cx.strokeStyle = 'rgba(20,14,10,.8)';
      cx.lineWidth = Math.max(1, E * .012);
      cx.strokeRect(x0, y0, an, alto);
      cx.restore();
    },

    /* Abajo de los pedazos hay más pedazos. Se levanta uno y aparecen los de
       abajo, iguales, sin tierra en el fondo. */
    /* La linea que ella busca, que no llega a ser una linea.

       Antes esto dibujaba capas hundiendose —un pedazo levantado y abajo mas
       pedazos, hasta perderse— porque el texto decia que no habia fondo. El
       texto cambio: ahora ella busca por donde se partio esto, el borde entre
       lo de antes y lo de despues, y el hallazgo es que ese borde no esta.
       Un dibujo que ilustra el parrafo viejo es peor que ninguno: contradice
       al que se esta leyendo.

       Se dibuja el gesto de buscar. Un trazo fino recorre el monton de un lado
       al otro y va apareciendo por tramos, con huecos entre uno y otro, y
       ninguno se junta con el siguiente. Las puntas de cada tramo se encienden
       —ahi es donde uno cree que encontro algo— y despues no sigue. Barre con
       el tiempo: no es una figura puesta, es alguien pasando la mano. */
    ruina: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      cx.lineCap = 'round';

      /* A la altura del monton y no encima de el: con y0 en el centro de la
         figura la linea quedaba flotando en el aire arriba de los escombros,
         que es donde no hay nada que partir. */
      var ancho = E * 1.02, y0 = fy + E * .72;
      /* Cinco tramos con largos y huecos distintos: parejos se leerian como
         una linea de puntos, que es justamente una linea. */
      var TRAMOS = [[-1.00, -.62], [-.44, -.20], [-.02, .18], [.34, .52],
                    [.70, .96]];
      /* La mano barre de izquierda a derecha y vuelve. Cada tramo se enciende
         cuando la barrida lo pasa por encima, asi que el trazo no esta: se va
         haciendo. */
      var barrido = Math.sin(t * .55) * 1.15;

      for (var i = 0; i < TRAMOS.length; i++) {
        var x1 = fx + ancho * TRAMOS[i][0], x2 = fx + ancho * TRAMOS[i][1];
        var medio = (TRAMOS[i][0] + TRAMOS[i][1]) * .5;
        /* Cuanto de encendido esta este tramo: maximo cuando la mano esta
           encima, y se apaga a medida que se aleja. */
        var cerca = Math.max(0, 1 - Math.abs(barrido - medio) * 1.0);
        /* Con .16 de base los tramos que la mano no estaba tocando se perdian
           entre las tablas —que son claras— y en pantalla se veia un solo
           trazo suelto en vez de una linea cortada. La linea entera tiene que
           leerse siempre: lo que cambia con la barrida es cual esta encendido,
           no cuales existen. */
        var brillo = a * (.38 + cerca * .58);
        if (brillo < .02) continue;

        /* La linea baja y sube un poco: sigue el terreno roto en vez de cruzar
           derecha por encima, que se leeria como una regla apoyada. */
        var yA = y0 + Math.sin(TRAMOS[i][0] * 4.1) * E * .055;
        var yB = y0 + Math.sin(TRAMOS[i][1] * 4.1) * E * .055;
        /* Con un reborde oscuro abajo. Las tablas del monton son claras y un
           trazo blanco fino encima de ellas se confunde con el borde de una
           tabla; el reborde lo despega y hace que se lea como una linea que
           esta POR ENCIMA de todo esto, buscando. */
        cx.beginPath();
        cx.moveTo(x1, yA);
        cx.quadraticCurveTo((x1 + x2) * .5, (yA + yB) * .5 - E * .03, x2, yB);
        cx.globalAlpha = brillo * .75;
        cx.strokeStyle = 'rgba(12,10,24,.9)';
        cx.lineWidth = Math.max(2, E * .030);
        cx.stroke();
        cx.globalAlpha = brillo;
        cx.strokeStyle = 'rgba(232,228,248,.98)';
        cx.lineWidth = Math.max(1.4, E * .016);
        cx.stroke();

        /* Las dos puntas encendidas: ahi es donde uno cree que encontro el
           borde. Que sean las PUNTAS y no el medio es lo que hace que se lea
           que la linea se corta, y no que esta desdibujada. */
        halo(cx, x1, yA, E * .10, '255,240,210', .48 * brillo);
        halo(cx, x2, yB, E * .10, '255,240,210', .48 * brillo);
      }

      cx.restore();
    },

    /* Cuando los mira, se sincronizan. */
    /* Los pajaros se sincronizan cuando ella los mira, y eso lo hace el
       pintor: son ESTOS pajaros los que le hacen caso, no otros. Aca queda
       nada mas el aire, que late al mismo ritmo que las alas — la misma
       frecuencia comun a la que se van todos, para que se vea que lo que se
       puso de acuerdo es el lugar entero y no un grupito. */
    bandada: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      var pulso = Math.sin(t * 9) * .5 + .5;
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      halo(cx, fx, fy, E * (1.15 + pulso * .18), '190,205,255', .085 * a * (.45 + pulso * .55));
      cx.restore();
    },

    /* La soga se pierde y en algún punto deja de existir. */
    barca: function (cx, fx, fy, E, t, v) {
      /* La soga sale tensa, sube, y en algun punto simplemente deja de estar.
         Con puntos finos y transparentes casi no se veia: ahora es una soga de
         verdad que se apaga, y el punto donde termina lleva su propio brillo
         para que se lea que ahi se corta. */
      var a = entra(v);
      /* Sale de la proa, no del medio del casco.

         Estaba naciendo en x = -.34E, con la barca que va de -1,01 a +0,86:
         la soga brotaba del centro del bote como si estuviera atada al piso de
         adentro. Ahora arranca en la punta de la proa y sube desde ahi, que es
         de donde sale una soga de amarre. Y es mas corta: la de antes se iba
         0,4E fuera de la figura, o sea que casi toda la soga pasaba lejos de
         la barca, y una soga lejos del bote no se lee como atada a el. */
      /* Medido sobre el dibujo: la punta del casco cae en -0,69E, +0,12E. El
         -0,86 de antes agarraba el remo que sobresale, no el bote, y la soga
         volvia a nacer en el aire. */
      var x0 = fx - E * .66, y0 = fy + E * .10;
      cx.save();
      cx.lineCap = 'round';
      var pasos = 20;
      for (var i = 0; i < pasos; i++) {
        var f = i / pasos, f2 = (i + 1) / pasos;
        var px = x0 - E * .30 * f,  py = y0 - E * .68 * f  + Math.sin(f  * 4 + t) * E * .025;
        var qx = x0 - E * .30 * f2, qy = y0 - E * .68 * f2 + Math.sin(f2 * 4 + t) * E * .025;
        cx.globalAlpha = a * Math.max(0, 1 - f * 1.15);
        cx.strokeStyle = 'rgba(236,220,186,.95)';
        cx.lineWidth = Math.max(1.2, E * .022 * (1 - f * .55));
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(qx, qy); cx.stroke();
      }
      // Donde deja de existir.
      cx.globalAlpha = a;
      halo(cx, x0 - E * .26, y0 - E * .60, E * .20, '236,220,186', .30 * a);
      cx.restore();
    },

    /* Ella, adentro, durmiendo. Es la revelación del juego entero: se dibuja
       apenas, porque lo que importa es entender, no mirar. */
    cama: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      cx.globalAlpha = a * .9;
      // Un bulto bajo las sabanas y la cabeza sobre la almohada.
      cx.fillStyle = 'rgba(228,226,238,.85)';
      cx.beginPath();
      cx.moveTo(fx - E * .34, fy + E * .10);
      cx.quadraticCurveTo(fx - E * .05, fy - E * .12, fx + E * .30, fy + E * .06);
      cx.lineTo(fx + E * .30, fy + E * .12);
      cx.lineTo(fx - E * .34, fy + E * .12);
      cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(58,36,24,.9)';
      cx.beginPath();
      cx.arc(fx - E * .40, fy + E * .02, E * .075, 0, 6.2832);
      cx.fill();
      // La respiracion, que es lo unico que se mueve.
      halo(cx, fx - E * .05, fy + E * .02,
           E * (.34 + .03 * Math.sin(t * 1.1)), '210,220,255', .10 * a);
      cx.restore();
    }
  };

  /* Dibuja lo que el lugar escondía. `v` va de 0 a 1. Los últimos cuatro
     parámetros son el contexto de la escena: hay anomalías que necesitan saber
     dónde está ella o dónde está el piso. */
  function pintar(cx, clave, fx, fy, E, t, v, extra, W, H, belX, piso) {
    var f = PINTA[clave];
    if (!f || !(v > 0)) return false;
    f(cx, fx, fy, E, t, Math.min(1, v), extra, W, H, belX, piso);
    return true;
  }

  return { pintar: pintar, PINTA: PINTA };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Anomalias; }
