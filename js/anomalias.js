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
  function silueta(cx, x, y, alto, alfa) {
    if (!(alfa > .01)) return;
    var A = alto;
    cx.save();
    // La luz que la recorta, apenas mas viva justo detras de ella.
    halo(cx, x, y - A * .55, A * 1.05, '255,240,205', .26 * alfa);

    /* TODO el cuerpo es UN SOLO trazo con un solo relleno.

       Dibujado como formas sueltas —vestido, torso, cuello, cabeza, pelo—, con
       tinta translucida cada superposicion sumaba opacidad: donde el pelo
       cruzaba la cabeza quedaba un parche oscuro y donde no, uno claro, y esos
       parches dibujaban una cara. Aparecian dos ojos y dos cuernos sin que
       nadie los hubiera dibujado. Con un unico fill las subrutas se funden y
       la silueta queda pareja, que es lo unico que una silueta tiene que ser. */
    cx.fillStyle = 'rgba(16,12,22,' + (.82 * alfa).toFixed(3) + ')';
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
    montania: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      /* La punta de la via, calculada del perfil de verdad y no a ojo.

         Estaba en un punto fijo —fx + .92E, fy - .22E— que cae casi tres
         cuartos de E MAS ARRIBA de donde la via termina realmente. El corte
         quedaba flotando en el cielo, lejos del riel: se leia como una
         estrella fugaz y no como unas vias cortadas, que es justo lo que el
         texto dice. Si la anomalia no esta pegada a la cosa, no es la cosa. */
      var pts = (typeof Figuras !== 'undefined' && Figuras.perfilMontania)
        ? Figuras.perfilMontania() : null;
      var ult = pts ? pts[pts.length - 1] : [1, .55];
      var ante = pts ? pts[pts.length - 2] : [.92, .40];
      var px = fx + E * ult[0], py = fy + E * ult[1];
      // Y lo que falta sigue la direccion en la que la via venia, no una fija.
      var dx = ult[0] - ante[0], dy = ult[1] - ante[1];
      var largo = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= largo; dy /= largo;

      cx.save();
      cx.globalAlpha = a;
      // El tramo que falta, insinuado y hueco.
      cx.setLineDash([E * .04, E * .05]);
      cx.strokeStyle = 'rgba(214,222,255,' + (.22 * a).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * .012);
      cx.beginPath();
      cx.moveTo(px, py);
      cx.lineTo(px + dx * E * .55, py + dy * E * .55);
      cx.stroke();
      cx.setLineDash([]);
      // El punto exacto donde deja de existir.
      halo(cx, px, py, E * .20, '255,236,190', .30 * a);
      cx.fillStyle = 'rgba(255,240,205,' + (.85 * a).toFixed(3) + ')';
      cx.beginPath(); cx.arc(px, py, Math.max(1.5, E * .018), 0, 6.2832); cx.fill();
      cx.restore();
    },

    /* La luz baja del todo, como quien asiente. */
    platillo: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      // El haz se cierra sobre si mismo.
      /* Encima del haz que ya esta pintado se pone uno oscuro que lo tapa:
         asi la luz se apaga de verdad en vez de apenas afinarse. */
      var g = cx.createLinearGradient(fx, fy, fx, fy + E * 1.5);
      g.addColorStop(0, 'rgba(10,10,24,' + (.55 * a).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(10,10,24,' + (.80 * a).toFixed(3) + ')');
      cx.fillStyle = g;
      cx.beginPath();
      cx.moveTo(fx - E * .34, fy);
      cx.lineTo(fx + E * .34, fy);
      cx.lineTo(fx + E * .70, fy + E * 1.5);
      cx.lineTo(fx - E * .70, fy + E * 1.5);
      cx.closePath(); cx.fill();
      /* La cupula se enciende una vez, despacio, y se apaga: es el asentir.
         Sin esto la anomalia era apagar una luz, que no se lee como respuesta. */
      var pulso = Math.max(0, Math.sin(a * Math.PI));
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
      cx.save();
      cx.globalAlpha = a;
      /* Sobre el agua, que se dibuja alrededor de la figura: contra la linea
         del piso el hueco caia en el vacio, fuera del charco. */
      /* En el borde del agua del lado de ella: el texto dice "me asomo", asi
         que el reflejo que falta esta donde ella se asoma, no en el medio. */
      var hx = fx - E * .80, hy = fy + E * .14;
      var an = E * .10, alto = E * .30;
      // Alrededor del hueco el agua sigue devolviendo luz.
      halo(cx, hx, hy, E * .34, '150,190,255', .16 * a);
      // Y el hueco: agua sin nadie adentro.
      cx.fillStyle = 'rgba(6,9,20,' + (.92 * a).toFixed(3) + ')';
      cx.beginPath();
      cx.ellipse(hx, hy, an, alto, 0, 0, 6.2832);
      cx.fill();
      cx.strokeStyle = 'rgba(170,200,255,' + (.42 * a).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * .010);
      cx.beginPath();
      cx.ellipse(hx, hy, an, alto, 0, 0, 6.2832);
      cx.stroke();
      cx.restore();
    },

    /* El haz frena sobre ella. Deja de barrer y se queda. */
    faro: function (cx, fx, fy, E, t, v, extra, W, H, belX, piso) {
      var a = entra(v);
      if (belX === undefined) return;
      var ox = fx - E * .04, oy = fy - E * .62;
      var dx = belX - ox, dy = (piso - E * .5) - oy;
      var largo = Math.sqrt(dx * dx + dy * dy) * 1.15;
      var ang = Math.atan2(dy, dx);
      var abre = .13;
      cx.save();
      cx.globalAlpha = a;
      var g = cx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(1, largo));
      g.addColorStop(0, 'rgba(255,244,214,.30)');
      g.addColorStop(.7, 'rgba(255,240,200,.10)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      cx.fillStyle = g;
      cx.beginPath();
      cx.moveTo(ox, oy);
      cx.arc(ox, oy, largo, ang - abre, ang + abre);
      cx.closePath(); cx.fill();
      // La quietud: el haz no tiembla, late apenas.
      halo(cx, belX, piso - E * .30, E * (.34 + .04 * Math.sin(t * 1.4)), '255,240,205', .13 * a);
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
      silueta(cx, ox + E * .01, fy - E * .455, E * .20, a);
    },

    /* Las ventanas están prendidas y adentro no hay nada que las prenda. */
    casa: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      cx.globalAlpha = a;
      [[-.17, -.10], [.17, -.10]].forEach(function (p) {
        var vx = fx + E * p[0], vy = fy + E * p[1];
        // La luz sale del vidrio, no de adentro: el interior queda a oscuras.
        halo(cx, vx, vy, E * .30, '255,226,170', .30);
        cx.fillStyle = 'rgba(12,10,18,' + (.55 * a).toFixed(3) + ')';
        cx.fillRect(vx - E * .055, vy - E * .055, E * .11, E * .11);
        cx.strokeStyle = 'rgba(255,232,180,' + (.75 * a).toFixed(3) + ')';
        cx.lineWidth = Math.max(1, E * .012);
        cx.strokeRect(vx - E * .055, vy - E * .055, E * .11, E * .11);
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
      halo(cx, px, py, E * .34, cuerpo.join(','), .46 * a);
      // Cuerpo: dos curvas y una cola. Chico y nitido, para que se lea.
      var r = E * .094;
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
    luna: function (cx, fx, fy, E, t, v) {
      /* Los crateres se acomodan y sugieren una cara — pero NO una sonrisa.
         Con la boca curva quedaba un emoji, y el texto dice "una cara que esta
         por decir algo y todavia busca por donde empezar": eso es una boca
         entreabierta y despareja, no contenta. */
      var a = entra(v);
      cx.save();
      cx.globalAlpha = a * .8;
      cx.fillStyle = 'rgba(116,120,146,.5)';
      // Dos ojos, a distinta altura: la asimetria es lo que la vuelve una cara
      // y no un dibujo.
      [[-.30, -.22, .105], [.28, -.16, .085]].forEach(function (o) {
        var x = fx + E * o[0] * (1 + (1 - a) * .9);
        var y = fy + E * o[1] * (1 + (1 - a) * .9);
        cx.beginPath(); cx.arc(x, y, E * o[2], 0, 6.2832); cx.fill();
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
    ruina: function (cx, fx, fy, E, t, v) {
      /* Se levanta un pedazo y abajo hay mas pedazos, y abajo mas. Se dibujan
         las capas hundiendose: sin varias no se lee que no hay fondo. */
      var a = entra(v);
      cx.save();
      cx.lineCap = 'round';
      // El pedazo levantado, en el aire.
      cx.globalAlpha = a;
      cx.strokeStyle = 'rgba(206,202,212,.95)';
      cx.lineWidth = Math.max(1.6, E * .026);
      cx.save();
      cx.translate(fx - E * .30, fy - E * .10 - E * .34 * a);
      cx.rotate(-.7 * a);
      cx.beginPath(); cx.moveTo(-E * .15, 0); cx.lineTo(E * .15, 0); cx.stroke();
      cx.restore();
      // El hueco que dejo, y abajo mas de lo mismo hasta perderse.
      cx.strokeStyle = 'rgba(150,148,162,.95)';
      for (var i = 0; i < 6; i++) {
        cx.globalAlpha = a * (.85 - i * .13);
        cx.lineWidth = Math.max(1, E * (.022 - i * .002));
        var y = fy + E * (.02 + i * .085);
        var an = E * (.26 - i * .028);
        cx.beginPath();
        cx.moveTo(fx - E * .30 - an, y);
        cx.lineTo(fx - E * .30 + an, y + E * .02);
        cx.stroke();
        cx.beginPath();
        cx.moveTo(fx - E * .30 - an * .5, y + E * .04);
        cx.lineTo(fx - E * .30 + an * .8, y + E * .015);
        cx.stroke();
      }
      cx.restore();
    },

    /* Cuando los mira, se sincronizan. */
    bandada: function (cx, fx, fy, E, t, v) {
      var a = entra(v);
      cx.save();
      cx.globalAlpha = a;
      cx.strokeStyle = 'rgba(226,232,255,.85)';
      cx.lineWidth = Math.max(1, E * .012);
      cx.lineCap = 'round';
      // Todas las alas en el MISMO angulo: eso es la anomalia.
      var bat = Math.sin(t * 3.4) * .5 + .5;
      for (var i = 0; i < 10; i++) {
        var x = fx + E * (-.55 + (i % 5) * .28);
        var y = fy + E * (-.30 + Math.floor(i / 5) * .34);
        var ala = E * .10 * (.35 + bat * .65);
        cx.beginPath();
        cx.moveTo(x - E * .09, y + ala);
        cx.lineTo(x, y - ala * .5);
        cx.lineTo(x + E * .09, y + ala);
        cx.stroke();
      }
      cx.restore();
    },

    /* La soga se pierde y en algún punto deja de existir. */
    barca: function (cx, fx, fy, E, t, v) {
      /* La soga sale tensa, sube, y en algun punto simplemente deja de estar.
         Con puntos finos y transparentes casi no se veia: ahora es una soga de
         verdad que se apaga, y el punto donde termina lleva su propio brillo
         para que se lea que ahi se corta. */
      var a = entra(v);
      var x0 = fx - E * .34, y0 = fy + E * .06;
      cx.save();
      cx.lineCap = 'round';
      var pasos = 20;
      for (var i = 0; i < pasos; i++) {
        var f = i / pasos, f2 = (i + 1) / pasos;
        var px = x0 - E * 1.05 * f,  py = y0 - E * .60 * f  + Math.sin(f  * 4 + t) * E * .025;
        var qx = x0 - E * 1.05 * f2, qy = y0 - E * .60 * f2 + Math.sin(f2 * 4 + t) * E * .025;
        cx.globalAlpha = a * Math.max(0, 1 - f * 1.15);
        cx.strokeStyle = 'rgba(236,220,186,.95)';
        cx.lineWidth = Math.max(1.2, E * .022 * (1 - f * .55));
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(qx, qy); cx.stroke();
      }
      // Donde deja de existir.
      cx.globalAlpha = a;
      halo(cx, x0 - E * .92, y0 - E * .53, E * .20, '236,220,186', .30 * a);
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
