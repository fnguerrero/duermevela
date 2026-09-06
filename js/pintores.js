/* Los pintores.

   Las figuras de figuras.js son segmentos: sirven para el vuelo de las piezas,
   pero como dibujo son palitos. Acá está la otra mitad — cada figura pintada
   en serio, con relleno, luz y volumen.

   El juego usa las dos: mientras la carta hace efecto se ven las piezas
   volando, y cuando aterrizan aparece esto. */
var Pintores = (function () {
  'use strict';

  function sembrado(n) {
    var s = n >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* Halo suave. Se usa tanto que conviene tenerlo a mano. */
  function halo(cx, x, y, r, color, fuerza) {
    var g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + color + ',' + fuerza + ')');
    g.addColorStop(.5, 'rgba(' + color + ',' + (fuerza * .28) + ')');
    g.addColorStop(1, 'rgba(' + color + ',0)');
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
    cx.restore();
  }

  /* ============ el platillo ============ */
  /* `apaga` va de 0 a 1 y es lo que este lugar esconde: la luz baja del todo,
     como quien asiente. Va aca porque apagar una luz es dejar de dibujarla.

     Antes lo hacia la anomalia poniendo un trapecio OSCURO encima del haz, y
     se veia lo que era: un rectangulo negro pegado sobre la escena, con dos
     bordes rectos que no eran de nada. Un parche encima nunca apaga; tapa. */
  function platillo(cx, E, t, alPiso, apaga) {
    var baja = Math.max(0, Math.min(1, apaga || 0));
    var flota = Math.sin(t * .8) * E * .04;
    /* Y se inclina, muy poco, como algo que se sostiene solo y corrige. Sin
       esto es un disco pegado al aire. */
    var ladeo = Math.sin(t * .43) * .035 + Math.sin(t * .77) * .015;
    // Si sabemos a que altura esta el suelo, el haz llega hasta ahi y deja un
    // charco de luz. Cortado en el aire se ve como un recorte pegado.
    var hastaPiso = (alPiso && alPiso > E * .4) ? alPiso - flota : E * 1.45;
    cx.save();
    cx.translate(0, flota);
    cx.rotate(ladeo);

    // El cono de luz va primero: todo lo demás se apoya encima.
    var largo = hastaPiso, boca = E * .55 + hastaPiso * .32;
    var vive = 1 - baja;
    var cono = cx.createLinearGradient(0, E * .1, 0, E * .1 + largo);
    cono.addColorStop(0, 'rgba(190,225,255,' + (.34 * vive).toFixed(3) + ')');
    cono.addColorStop(.45, 'rgba(160,205,255,' + (.13 * vive).toFixed(3) + ')');
    cono.addColorStop(1, 'rgba(140,190,255,0)');
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = cono;
    cx.beginPath();
    cx.moveTo(-E * .28, E * .12);
    cx.lineTo(E * .28, E * .12);
    cx.lineTo(boca, E * .12 + largo);
    cx.lineTo(-boca, E * .12 + largo);
    cx.closePath(); cx.fill();

    // Motas subiendo por el haz.
    var rnd = sembrado(11);
    for (var i = 0; i < 26; i++) {
      var fase = (t * .34 + rnd()) % 1;
      var yy = E * .12 + largo * (1 - fase);
      var an = E * .28 + (boca - E * .28) * (1 - fase);
      var xx = (rnd() * 2 - 1) * an;
      var a = Math.sin(fase * Math.PI) * .5 * vive;
      cx.fillStyle = 'rgba(215,240,255,' + a.toFixed(3) + ')';
      cx.beginPath(); cx.arc(xx, yy, 1.5 + rnd() * 1.6, 0, 6.2832); cx.fill();
    }
    // Charco donde el haz toca el piso.
    if (alPiso && alPiso > E * .4) {
      var ch = cx.createRadialGradient(0, E * .12 + largo, 0, 0, E * .12 + largo, boca);
      ch.addColorStop(0, 'rgba(200,230,255,' + (.30 * vive).toFixed(3) + ')');
      ch.addColorStop(.55, 'rgba(160,200,255,' + (.10 * vive).toFixed(3) + ')');
      ch.addColorStop(1, 'rgba(150,190,255,0)');
      cx.fillStyle = ch;
      cx.beginPath();
      cx.ellipse(0, E * .12 + largo, boca, boca * .17, 0, 0, 6.2832);
      cx.fill();
    }
    cx.restore();

    // Resplandor de fondo.
    halo(cx, 0, 0, E * 1.5, '150,190,255', .16);

    // Cúpula: vidrio con reflejo.
    var cup = cx.createLinearGradient(-E * .3, -E * .58, E * .3, -E * .05);
    cup.addColorStop(0, 'rgba(190,225,255,.85)');
    cup.addColorStop(.5, 'rgba(120,165,225,.55)');
    cup.addColorStop(1, 'rgba(70,105,165,.5)');
    cx.fillStyle = cup;
    cx.beginPath();
    cx.ellipse(0, -E * .05, E * .46, E * .52, 0, Math.PI, 0);
    cx.closePath(); cx.fill();
    // Tres ventanas en la cupula. Sin ellas es una burbuja lisa.
    for (var vn = 0; vn < 3; vn++) {
      var av = -Math.PI * .78 + vn * Math.PI * .28;
      var wx = Math.cos(av) * E * .30, wy = Math.sin(av) * E * .30 - E * .12;
      cx.fillStyle = 'rgba(190,225,255,.55)';
      cx.beginPath();
      cx.ellipse(wx, wy, E * .055, E * .075, 0, 0, 6.2832);
      cx.fill();
      cx.strokeStyle = 'rgba(40,60,100,.5)';
      cx.lineWidth = E * .010;
      cx.stroke();
    }
    // Brillo del vidrio.
    cx.fillStyle = 'rgba(255,255,255,.30)';
    cx.beginPath();
    cx.ellipse(-E * .16, -E * .28, E * .10, E * .19, -.4, 0, 6.2832);
    cx.fill();

    // Casco: dos elipses con un degradé metálico entre ellas.
    var met = cx.createLinearGradient(0, -E * .12, 0, E * .30);
    met.addColorStop(0, '#c9d6ea');
    met.addColorStop(.34, '#8593ad');
    met.addColorStop(.62, '#4d5872');
    met.addColorStop(1, '#2b3145');
    cx.fillStyle = met;
    cx.beginPath();
    cx.ellipse(0, E * .10, E, E * .22, 0, 0, 6.2832);
    cx.fill();

    // Filo iluminado por arriba.
    cx.strokeStyle = 'rgba(225,240,255,.55)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.ellipse(0, E * .10, E, E * .22, 0, Math.PI, 0);
    cx.stroke();

    // Panza más oscura, para que el disco tenga espesor.
    var panza = cx.createLinearGradient(0, E * .10, 0, E * .34);
    panza.addColorStop(0, 'rgba(40,46,66,0)');
    panza.addColorStop(1, 'rgba(16,19,30,.9)');
    cx.fillStyle = panza;
    cx.beginPath();
    cx.ellipse(0, E * .10, E, E * .22, 0, 0, Math.PI);
    cx.fill();

    // Anillo de luces: cada una late en su momento.
    for (var l = 0; l < 14; l++) {
      var ang = l / 14 * 6.2832;
      var lx = Math.cos(ang) * E * .84, ly = Math.sin(ang) * E * .185 + E * .10;
      // Las de atrás quedan tapadas por el casco.
      var atras = Math.sin(ang) < 0;
      var pul = .45 + .55 * Math.sin(t * 2.4 - l * .55);
      var col = atras ? '120,160,220' : '255,225,170';
      halo(cx, lx, ly, E * .075 * (.7 + pul * .5), col, (atras ? .22 : .55) * pul);
      cx.fillStyle = 'rgba(255,250,235,' + ((atras ? .3 : .95) * pul).toFixed(3) + ')';
      cx.beginPath(); cx.arc(lx, ly, E * .017, 0, 6.2832); cx.fill();
    }

    cx.restore();
  }

  /* ============ la montaña rusa ============ */
  /* `corte` va de 0 a 1 y es lo que este lugar esconde: con 0 la montaña rusa
     esta entera, y a medida que sube, el ultimo tramo de via se adelgaza, se
     apaga y desaparece, junto con las vigas que lo sostenian.

     Va aca y no en la anomalia por dos razones. Una: dibujar el tramo que
     falta —que es lo que se probo antes— CONTRADICE el texto, que dice que
     nadie se tomo el trabajo de imaginarles un final; si se dibuja, deja de
     faltar, y ademas quedaban dos vias, la real y una flotando al lado. Dos:
     tapar el tramo desde encima con el color del fondo no se puede, porque el
     fondo del juego no es plano — tiene degrade, halo de color y el destello
     de la carta — y el parche se veria. La unica forma honesta de que algo no
     este es no dibujarlo. */
  function montania(cx, E, t, perfil, corte) {
    var pts = perfil;
    var q = Math.max(0, Math.min(1, corte || 0));
    /* Cuanto de la via se va: hasta la ultima cresta, de a poco.

       Era el ultimo quinto, y ahi estaba el error de fondo que ninguna de las
       tres vueltas anteriores toco. El perfil TERMINA ABAJO, casi en el piso:
       borrarle el ultimo pedazo deja una via que se acaba a un metro del
       suelo, y una via que se acaba abajo no se lee como cortada — se lee como
       terminada. El texto dice que se cortan EN EL AIRE.

       Deshaciendo hasta la cima de la joroba, la via queda subiendo y
       parandose en alto, a mas de una E del piso, con nada despues y nada
       debajo. Eso si es no haberles imaginado un final. */
    var desde = pts.length - 1 - Math.round(q * (pts.length - 1) * .31);
    function vive(i) { return i < desde; }
    function apagado(i) {
      // Los ultimos que quedan se van desvaneciendo, no se cortan de golpe.
      var borde = desde - 1;
      var d = borde - i;
      return d < 2 ? Math.max(0, .35 + d * .32) : 1;
    }
    /* Estructura: columnas y cruces de madera.

       Se leia como un plano tecnico y no como una montaña rusa: todas las
       lineas del mismo grosor y del mismo color, una cruz entre cada par de
       columnas, y la via perdida entre medio. Tres cosas lo separan. Las
       columnas van cada CUATRO puntos y no cada tres, asi que el andamio
       respira. Cada una es mas gruesa abajo que arriba, que es como se
       sostiene algo pesado y lo que le da volumen a una linea. Y las cruces
       van una si y una no, mas tenues: estan para que se entienda que hay una
       estructura, no para que se cuenten. */
    cx.lineCap = 'round';
    for (var c = 0; c < pts.length; c += 4) {
      if (q > 0 && !vive(c)) continue;
      var p = pts[c];
      // Mas gruesa cuanto mas alto sostiene: una columna corta no necesita tanto.
      var largoCol = 1 - p[1];
      cx.strokeStyle = 'rgba(104,84,112,.78)';
      cx.lineWidth = E * (.013 + largoCol * .009);
      cx.beginPath();
      cx.moveTo(p[0] * E, p[1] * E); cx.lineTo(p[0] * E, E);
      cx.stroke();
      /* Ojo con el nombre: esta variable se llamaba `q`, igual que el factor
         de corte, y lo pisaba en la primera vuelta del bucle. A partir de ahi
         `q > 0` comparaba un array contra cero y daba false, asi que las
         columnas y las cruces NUNCA se cortaban: la via desaparecia y la
         estructura quedaba entera, sosteniendo un tramo que ya no existia. */
      if (c + 4 < pts.length && vive(c + 4) && (c / 4) % 2 === 0) {
        var sig = pts[c + 4];
        cx.strokeStyle = 'rgba(78,64,88,.34)';
        cx.lineWidth = E * .007;
        cx.beginPath();
        cx.moveTo(p[0] * E, p[1] * E); cx.lineTo(sig[0] * E, E);
        cx.moveTo(sig[0] * E, sig[1] * E); cx.lineTo(p[0] * E, E);
        cx.stroke();
      }
    }
    // La vía: dos rieles y los durmientes.
    for (var k = 1; k < pts.length; k++) {
      if (q > 0 && !vive(k)) continue;
      cx.globalAlpha = q > 0 ? apagado(k) : 1;
      /* Y la via manda sobre la estructura: mas gruesa y mas clara. Es lo
         unico de la figura que el texto nombra, y estaba dibujada con el mismo
         peso que un travesaño cualquiera. */
      var a = pts[k - 1], b = pts[k];
      cx.strokeStyle = 'rgba(52,42,64,.92)';
      cx.lineWidth = E * .042;
      cx.beginPath();
      cx.moveTo(a[0] * E, a[1] * E + E * .014);
      cx.lineTo(b[0] * E, b[1] * E + E * .014);
      cx.stroke();
      cx.strokeStyle = 'rgba(224,206,248,.94)';
      cx.lineWidth = E * .016;
      cx.beginPath();
      cx.moveTo(a[0] * E, a[1] * E); cx.lineTo(b[0] * E, b[1] * E);
      cx.stroke();
    }
    cx.globalAlpha = 1;
    // Durmientes: travesanos cortos perpendiculares a la via.
    for (var d = 0; d < pts.length - 1; d += 1) {
      if (q > 0 && !vive(d)) continue;
      cx.globalAlpha = q > 0 ? apagado(d) : 1;
      var a2 = pts[d], b2 = pts[d + 1];
      var ang = Math.atan2(b2[1] - a2[1], b2[0] - a2[0]);
      var nx = -Math.sin(ang), ny = Math.cos(ang);
      cx.strokeStyle = 'rgba(70,58,84,.75)';
      cx.lineWidth = E * .009;
      cx.beginPath();
      cx.moveTo(a2[0] * E - nx * E * .022, a2[1] * E - ny * E * .022);
      cx.lineTo(a2[0] * E + nx * E * .022, a2[1] * E + ny * E * .022);
      cx.stroke();
    }
    cx.globalAlpha = 1;

    /* El vagon recorre la via. Estaba parado en la estacion y una montana rusa
       quieta no es una montana rusa: es un andamio. */
    /* Y no pasa de donde la via existe: con el tramo deshecho, el vagon
       seguia su recorrido y salia andando por el aire. */
    var hasta = q > 0 ? Math.max(2, desde - 1) : pts.length - 1;
    var avance = (t * .085) % 1;
    var iVia = Math.min(hasta - 1, Math.floor(avance * hasta));
    var fVia = Math.min(1, avance * hasta - iVia);
    var pa = pts[iVia], pb = pts[iVia + 1];
    var vx = (pa[0] + (pb[0] - pa[0]) * fVia) * E;
    var vy = (pa[1] + (pb[1] - pa[1]) * fVia) * E + E * .035;
    var angVia = Math.atan2((pb[1] - pa[1]) * E, (pb[0] - pa[0]) * E);
    cx.save();
    cx.translate(vx, vy);
    cx.rotate(angVia);
    cx.fillStyle = '#3a2a55';
    cx.beginPath();
    cx.moveTo(-E * .075, 0);
    cx.lineTo(E * .105, 0);
    cx.quadraticCurveTo(E * .135, E * .022, E * .112, E * .052);
    cx.lineTo(-E * .06, E * .052);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#c23a48';
    cx.fillRect(-E * .075, E * .012, E * .18, E * .015);
    cx.fillStyle = '#12101c';
    cx.beginPath(); cx.arc(-E * .038, E * .056, E * .013, 0, 6.2832); cx.fill();
    cx.beginPath(); cx.arc(E * .068, E * .056, E * .013, 0, 6.2832); cx.fill();
    cx.restore();

    // Guirnalda de bombitas sobre la vía.
    for (var m = 0; m < pts.length; m += 2) {
      var pm = pts[m];
      var pul = .5 + .5 * Math.sin(t * 1.7 + m * .7);
      halo(cx, pm[0] * E, pm[1] * E - E * .03, E * .05 * pul, '255,205,130', .5 * pul);
    }
  }

  /* ============ la luna ============ */
  function luna(cx, E, t) {
    var R = E * .82;
    halo(cx, 0, 0, R * 2.3, '200,205,255', .22);
    // Cuerpo.
    var g = cx.createRadialGradient(-R * .3, -R * .35, R * .1, 0, 0, R);
    g.addColorStop(0, '#f6f2e4');
    g.addColorStop(.62, '#d8d2c4');
    g.addColorStop(1, '#a8a49c');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(0, 0, R, 0, 6.2832); cx.fill();
    // Mares y cráteres.
    var rnd = sembrado(3);
    for (var i = 0; i < 13; i++) {
      var a = rnd() * 6.2832, d = Math.pow(rnd(), .6) * R * .82;
      var cx0 = Math.cos(a) * d, cy0 = Math.sin(a) * d;
      var rr = R * (.05 + rnd() * .17);
      cx.fillStyle = 'rgba(150,146,144,' + (.16 + rnd() * .2).toFixed(3) + ')';
      cx.beginPath(); cx.arc(cx0, cy0, rr, 0, 6.2832); cx.fill();
      // Borde iluminado del cráter.
      cx.strokeStyle = 'rgba(255,252,240,.16)';
      cx.lineWidth = 1.2;
      cx.beginPath(); cx.arc(cx0 - rr * .06, cy0 - rr * .06, rr, 0, 6.2832); cx.stroke();
    }
    // Sombra del limbo.
    var s = cx.createRadialGradient(0, 0, R * .55, 0, 0, R);
    s.addColorStop(0, 'rgba(20,20,40,0)');
    s.addColorStop(1, 'rgba(20,20,45,.42)');
    cx.fillStyle = s;
    cx.beginPath(); cx.arc(0, 0, R, 0, 6.2832); cx.fill();
  }

  /* ============ la ruina ============ */
  function ruina(cx, E, t) {
    var rnd = sembrado(7);
    // Polvo que todavía no bajó.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < 16; d++) {
      var dx = (rnd() * 2 - 1) * E, dy = E * (.3 + rnd() * .7);
      var rr = E * (.1 + rnd() * .22);
      var sube = (Math.sin(t * .3 + d) * .5 + .5) * E * .1;
      cx.fillStyle = 'rgba(120,105,120,.05)';
      cx.beginPath(); cx.arc(dx, dy - sube, rr, 0, 6.2832); cx.fill();
    }
    cx.restore();
    // Escombros con volumen.
    for (var i = 0; i < 40; i++) {
      var x = (rnd() * 2 - 1) * E * .98;
      var y = E * (.55 + rnd() * .44);
      var ang = (rnd() - .5) * 2.4;
      var lar = E * (.06 + rnd() * .2);
      var gr = E * (.012 + rnd() * .022);
      cx.save();
      cx.translate(x, y); cx.rotate(ang);
      cx.fillStyle = 'rgba(58,48,60,.95)';
      cx.fillRect(-lar, -gr, lar * 2, gr * 2);
      cx.fillStyle = 'rgba(140,124,142,.35)';
      cx.fillRect(-lar, -gr, lar * 2, gr * .55);
      cx.restore();
    }
    // Lo que quedó parado.
    for (var j = 0; j < 6; j++) {
      var xj = -E * .72 + j * E * .29;
      var hj = E * (.35 + rnd() * .5);
      cx.strokeStyle = 'rgba(70,58,74,.9)';
      cx.lineWidth = E * .022;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(xj, E); cx.lineTo(xj + (rnd() - .5) * E * .1, E - hj);
      cx.stroke();
    }
  }

  /* ============ el árbol ============ */
  function arbol(cx, E, t) {
    /* Un fractal de verdad, no un arbol con ramas.

       Antes cada nivel usaba angulos y proporciones distintas —.72 de un lado,
       .70 del otro, el angulo corregido por profundidad— y eso hace un arbol
       creible pero mata justo lo que se quiere mostrar: que la forma se repite
       a cada escala. Ahora la razon y el angulo son los MISMOS en todos los
       niveles, asi que cada rama es el arbol entero mas chico, y cada ramita
       es la rama. Es lo que dice el texto de este lugar.

       La profundidad sube de 6 a 9. Quien se acuesta abajo y mira para arriba
       puede seguir la repeticion tres niveles mas adentro. */
    var vientoT = t * .5;
    var RAZON = .74;          // cuanto se achica cada rama respecto de su madre
    /* Se abre mas que antes (.35): el arbol tiene que imponer, y hacia arriba
       no puede crecer porque ahi esta el texto del lugar. Asi gana copa y
       presencia sin subir. */
    var ABRE = .44;           // cuanto se abre cada hija, igual en todo nivel
    /* Con nueve niveles hay mas de doscientas puntas: un halo en cada una se
       junta con el de al lado y la copa se convierte en una mancha blanca. Se
       enciende una de cada tres, contando en el mismo orden siempre para que
       no titilen entre cuadros. */
    var punta = 0;
    var hoja = 0;

    function rama(x, y, ang, largo, grosor, prof) {
      if (prof <= 0 || largo < E * .014) return;
      /* El viento mece mas cuanto mas fina la rama, pero se mantiene chico:
         de mas, desordena la figura y la autosemejanza deja de verse. */
      var mece = Math.sin(vientoT + prof * 1.4 + x * .02) * (9 - prof) * .008;
      var a = ang + mece;
      var x2 = x + Math.cos(a) * largo, y2 = y + Math.sin(a) * largo;
      cx.strokeStyle = prof > 5 ? 'rgba(62,48,44,.95)' : 'rgba(96,74,62,.85)';
      cx.lineWidth = grosor;
      cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x2, y2); cx.stroke();
      if (prof <= 1 && (punta++ % 3 === 0)) {
        halo(cx, x2, y2, E * .028, '190,230,180', .22);
      }
      /* Las hojas van solo en las dos puntas finales y una de cada dos: con
         mas, los doscientos y pico de extremos se juntan en una mancha y se
         pierde la repeticion, que es lo que este lugar tiene que mostrar.
         Son oscuras a proposito — de noche una hoja no es verde brillante,
         y ademas asi no compiten con las puntas encendidas. */
      if (prof <= 2 && (hoja++ % 2 === 0)) {
        var hv = (hoja * 37 % 11) / 11;          // variacion estable por hoja
        cx.save();
        cx.translate(x2, y2);
        cx.rotate(a + (hv - .5) * .9);
        cx.fillStyle = 'rgba(' + Math.round(58 + hv * 26) + ',' +
                                 Math.round(96 + hv * 34) + ',' +
                                 Math.round(74 + hv * 20) + ',.55)';
        cx.beginPath();
        cx.ellipse(E * .020, 0, E * .022, E * .009, 0, 0, 6.2832);
        cx.fill();
        cx.restore();
      }
      rama(x2, y2, a - ABRE, largo * RAZON, grosor * .70, prof - 1);
      rama(x2, y2, a + ABRE, largo * RAZON, grosor * .70, prof - 1);
      /* Una tercera rama al centro, solo en el tronco: le saca la simetria
         perfecta de arriba sin ensuciar la repeticion de las puntas. */
      if (prof > 7) rama(x2, y2, a + .03, largo * .62, grosor * .55, prof - 2);
    }
    rama(0, E, -Math.PI / 2, E * .57, E * .094, 9);

    /* Un pajaro lejos, cruzando el cielo. Se ve siempre, aciertes o no, pero
       en silueta y sin color: el secreto de este lugar no es que haya un
       pajaro, es verlo de cerca. Quien falla el instante se queda sabiendo
       que habia algo y no que color tenia.
       Cruza cada catorce segundos y tarda cuatro en pasar, asi que la mayor
       parte del tiempo el cielo esta vacio y el cruce se siente un hallazgo. */
    var CICLO = 14, CRUCE = 4;
    var fase = (t % CICLO) / CRUCE;
    if (fase < 1) {
      var bx = E * (-2.0 + fase * 4.0);
      var by = -E * (1.18 + Math.sin(fase * Math.PI) * .10);
      var ala = Math.sin(t * 9) * .5 + .5;      // aleteo
      var br = E * .042;
      cx.save();
      // Se desvanece en los bordes: entra y sale del cuadro sin aparecer de golpe.
      cx.globalAlpha = Math.min(1, Math.sin(fase * Math.PI) * 2.2) * .50;
      /* Dos arcos y nada mas: la "v" es lo que el ojo lee como pajaro a esta
         distancia. Con cuerpo y alas separadas quedaba una mancha ovalada, que
         a seis pixeles se ve como un platillo y no como un ave. */
      cx.strokeStyle = 'rgba(186,200,226,1)';
      cx.lineWidth = Math.max(1.1, E * .0075);
      cx.lineCap = 'round';
      var alto = br * (.30 + ala * .85);
      cx.beginPath();
      cx.moveTo(bx - br * 1.5, by - alto);
      cx.quadraticCurveTo(bx - br * .55, by + br * .16, bx, by);
      cx.quadraticCurveTo(bx + br * .55, by + br * .16, bx + br * 1.5, by - alto);
      cx.stroke();
      cx.restore();
    }
  }


  /* ============ la cama ============ */
  function cama(cx, E, t) {
    var an = E * .89, al = E;
    // Sabana: la parte blanda va antes que la madera.
    var sab = cx.createLinearGradient(0, al * .10, 0, al * .32);
    sab.addColorStop(0, '#e8e2d8');
    sab.addColorStop(1, '#b3aca6');
    cx.fillStyle = sab;
    cx.beginPath();
    cx.moveTo(-an, al * .13);
    cx.quadraticCurveTo(0, al * .05, an, al * .13);
    cx.lineTo(an, al * .31);
    cx.quadraticCurveTo(0, al * .38, -an, al * .31);
    cx.closePath(); cx.fill();
    // Pliegues.
    cx.strokeStyle = 'rgba(120,112,110,.30)';
    cx.lineWidth = E * .006;
    for (var k = 0; k < 7; k++) {
      var xk = -an * .75 + k * an * .25;
      cx.beginPath();
      cx.moveTo(xk, al * .12); cx.lineTo(xk + al * .05, al * .32);
      cx.stroke();
    }
    // Almohada.
    cx.fillStyle = '#f0ebe0';
    cx.beginPath();
    cx.ellipse(-an * .68, al * .10, an * .22, al * .075, -.08, 0, 6.2832);
    cx.fill();

    // Madera: respaldo, piecera y patas.
    cx.strokeStyle = '#6d5240';
    cx.lineCap = 'round';
    cx.lineWidth = E * .028;
    cx.beginPath();
    cx.moveTo(-an * .99, al * .11); cx.lineTo(-an * .99, -al * .45);
    cx.moveTo(-an * .58, al * .11); cx.lineTo(-an * .58, -al * .45);
    cx.moveTo(-an * 1.02, -al * .45); cx.lineTo(-an * .55, -al * .45);
    cx.moveTo(an * .74, al * .13); cx.lineTo(an * .74, -al * .11);
    cx.moveTo(an * .99, al * .13); cx.lineTo(an * .99, -al * .11);
    cx.moveTo(an * .71, -al * .11); cx.lineTo(an * 1.02, -al * .11);
    cx.stroke();
    // Barrotes del respaldo.
    cx.lineWidth = E * .014;
    cx.strokeStyle = '#7d6049';
    for (var i = 1; i < 5; i++) {
      var x = -an * .99 + i * (an * .41 / 5);
      cx.beginPath(); cx.moveTo(x, al * .08); cx.lineTo(x, -al * .43); cx.stroke();
    }
    // Patas.
    cx.lineWidth = E * .026;
    cx.strokeStyle = '#5c4536';
    [-an * .92, -an * .62, an * .66, an * .93].forEach(function (px) {
      cx.beginPath(); cx.moveTo(px, al * .29); cx.lineTo(px, al * .62); cx.stroke();
    });
    // Mesa de luz con el velador: es lo que dice que esto es un cuarto.
    // Del lado derecho: a la izquierda de la cama es donde se para Bel.
    var mx = an * 1.24, my = al * .10;
    cx.fillStyle = '#6d5240';
    cx.fillRect(mx - E * .085, my, E * .17, E * .022);
    cx.strokeStyle = '#5c4536';
    cx.lineWidth = E * .018;
    cx.lineCap = 'round';
    cx.beginPath();
    cx.moveTo(mx - E * .065, my + E * .022); cx.lineTo(mx - E * .065, al * .62);
    cx.moveTo(mx + E * .065, my + E * .022); cx.lineTo(mx + E * .065, al * .62);
    cx.stroke();
    // El velador prendido.
    halo(cx, mx, my - E * .085, E * .28, '255,206,140', .55);
    cx.fillStyle = '#c8a86e';
    cx.beginPath();
    cx.moveTo(mx - E * .055, my - E * .04);
    cx.lineTo(mx + E * .055, my - E * .04);
    cx.lineTo(mx + E * .035, my - E * .12);
    cx.lineTo(mx - E * .035, my - E * .12);
    cx.closePath(); cx.fill();
    cx.strokeStyle = '#8a7048';
    cx.lineWidth = E * .010;
    cx.beginPath();
    cx.moveTo(mx, my - E * .04); cx.lineTo(mx, my);
    cx.stroke();

    halo(cx, 0, al * .2, E * 1.1, '210,200,255', .07);
  }

  /* ============ la puerta parada sola ============ */
  function puerta(cx, E, t) {
    var an = E * .40, al = E * .96;
    // Lo que se filtra por las juntas: es lo que hace que la puerta importe.
    var pul = .8 + .2 * Math.sin(t * .9);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    var luz = cx.createLinearGradient(0, E * .84, 0, E * .62);
    luz.addColorStop(0, 'rgba(255,224,160,0)');
    luz.addColorStop(1, 'rgba(255,214,140,' + (.5 * pul) + ')');
    cx.fillStyle = luz;
    cx.beginPath();
    cx.moveTo(-an, E * .70); cx.lineTo(an, E * .70);
    cx.lineTo(an * 1.9, E * .90); cx.lineTo(-an * 1.9, E * .90);
    cx.closePath(); cx.fill();
    cx.restore();
    halo(cx, 0, E * .70, E * .8, '255,208,130', .3 * pul);

    // Marco.
    cx.fillStyle = '#4a3728';
    cx.fillRect(-an - E * .12, -al, E * .10, al + E * .70);
    cx.fillRect(an + E * .02, -al, E * .10, al + E * .70);
    cx.fillRect(-an - E * .12, -al - E * .04, (an + E * .12) * 2, E * .10);
    // Hoja.
    var mad = cx.createLinearGradient(-an, 0, an, 0);
    mad.addColorStop(0, '#6b4e35');
    mad.addColorStop(.4, '#5a4029');
    mad.addColorStop(1, '#432f1f');
    cx.fillStyle = mad;
    cx.fillRect(-an, -al + E * .06, an * 2, al + E * .64);
    // Paneles hundidos.
    for (var q = 0; q < 2; q++) {
      var y0 = -al + E * .22 + q * E * .50;
      cx.strokeStyle = 'rgba(30,20,12,.6)';
      cx.lineWidth = E * .012;
      cx.strokeRect(-an + E * .11, y0, (an - E * .11) * 2, E * .34);
      cx.strokeStyle = 'rgba(150,120,88,.25)';
      cx.lineWidth = E * .006;
      cx.strokeRect(-an + E * .125, y0 + E * .012, (an - E * .125) * 2, E * .33);
    }
    // Picaporte.
    halo(cx, an - E * .15, -E * .10, E * .06, '255,220,150', .5);
    cx.fillStyle = '#d8b878';
    cx.beginPath(); cx.arc(an - E * .15, -E * .10, E * .028, 0, 6.2832); cx.fill();
  }

  /* ============ la casa ============ */
  function casa(cx, E, t) {
    var an = E * .82, al = E * .62;
    // Paredes.
    var par = cx.createLinearGradient(-an, 0, an, 0);
    par.addColorStop(0, '#4a4358');
    par.addColorStop(.5, '#3d3749');
    par.addColorStop(1, '#2e2937');
    cx.fillStyle = par;
    cx.fillRect(-an, -al, an * 2, al + E * .96);
    // Techo.
    cx.fillStyle = '#2a2334';
    cx.beginPath();
    cx.moveTo(-an - E * .12, -al);
    cx.lineTo(0, -al - E * .48);
    cx.lineTo(an + E * .12, -al);
    cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(160,150,190,.30)';
    cx.lineWidth = E * .01;
    cx.beginPath();
    cx.moveTo(-an - E * .12, -al); cx.lineTo(0, -al - E * .48);
    cx.lineTo(an + E * .12, -al); cx.stroke();
    // Chimenea con humo.
    cx.fillStyle = '#332c40';
    cx.fillRect(E * .34, -al - E * .58, E * .16, E * .40);
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (var h = 0; h < 7; h++) {
      var f = ((t * .18 + h / 7) % 1);
      cx.fillStyle = 'rgba(190,185,205,' + (.16 * (1 - f)) + ')';
      cx.beginPath();
      cx.arc(E * .42 + Math.sin(f * 4 + h) * E * .10,
             -al - E * .60 - f * E * .75, E * (.04 + f * .12), 0, 6.2832);
      cx.fill();
    }
    cx.restore();
    // Ventanas encendidas: el corazon del dibujo.
    [[-E * .46, -E * .16], [E * .30, -E * .16]].forEach(function (v, i) {
      var pul = .82 + .18 * Math.sin(t * 1.3 + i * 2);
      halo(cx, v[0], v[1], E * .34, '255,196,110', .5 * pul);
      var vg = cx.createLinearGradient(v[0], v[1] - E * .19, v[0], v[1] + E * .19);
      vg.addColorStop(0, 'rgba(255,222,160,' + (.95 * pul) + ')');
      vg.addColorStop(1, 'rgba(232,168,86,' + (.8 * pul) + ')');
      cx.fillStyle = vg;
      cx.fillRect(v[0] - E * .17, v[1] - E * .19, E * .34, E * .38);
      cx.strokeStyle = '#241d2c';
      cx.lineWidth = E * .018;
      cx.strokeRect(v[0] - E * .17, v[1] - E * .19, E * .34, E * .38);
      cx.lineWidth = E * .012;
      cx.beginPath();
      cx.moveTo(v[0], v[1] - E * .19); cx.lineTo(v[0], v[1] + E * .19);
      cx.moveTo(v[0] - E * .17, v[1]); cx.lineTo(v[0] + E * .17, v[1]);
      cx.stroke();
    });
    // Puerta.
    cx.fillStyle = '#241c2e';
    cx.fillRect(-E * .13, E * .34, E * .26, E * .62);
    // Marco y picaporte con un poco de relieve.
    cx.strokeStyle = 'rgba(150,132,110,.32)';
    cx.lineWidth = E * .012;
    cx.strokeRect(-E * .13, E * .34, E * .26, E * .62);
    cx.fillStyle = 'rgba(255,206,130,.85)';
    cx.beginPath(); cx.arc(E * .07, E * .62, E * .018, 0, 6.2832); cx.fill();

    // Sendero: piedras que se van agrandando hacia el frente.
    for (var sd = 0; sd < 5; sd++) {
      var f2 = sd / 4;
      cx.fillStyle = 'rgba(120,110,140,' + (.12 + f2 * .10).toFixed(3) + ')';
      cx.beginPath();
      cx.ellipse(-E * .02 - f2 * E * .10, E * (.99 + f2 * .10),
                 E * (.055 + f2 * .05), E * (.016 + f2 * .012), 0, 0, 6.2832);
      cx.fill();
    }
  }

  /* ============ la bandada ============ */
  /* `sincro` va de 0 a 1 y es lo que el lugar esconde: con 0 cada pajaro bate
     a su ritmo y con su propia fase, que es lo normal en una bandada; con 1
     baten todos exactamente juntos.

     Va aca y no en la anomalia porque son ESTOS pajaros los que se sincronizan.
     La anomalia dibujaba diez pajaros nuevos encima, quietos, en una grilla de
     cinco por dos y con otra forma: se leian como un bloque pegado sobre la
     escena y no como la bandada haciendole caso. */
  function bandada(cx, E, t, sincro) {
    var s = Math.max(0, Math.min(1, sincro || 0));
    var rnd = sembrado(19);
    for (var i = 0; i < 40; i++) {
      var x0 = (rnd() * 2 - 1) * E * .96;
      var y0 = (rnd() * 2 - 1) * E * .78;
      var vel = .5 + rnd() * .7;
      // Cada uno vuela a su ritmo y cruza el cuadro.
      var x = x0 + ((t * vel * E * .3) % (E * 2.4)) - E * 1.2;
      /* La frecuencia de cada uno se acerca a una comun, y la fase propia se
         apaga: por eso con sincro en 1 el aleteo es identico en los cuarenta. */
      var frec = (6 + vel * 5) + (9 - (6 + vel * 5)) * s;
      var bat = Math.sin(t * frec + i * (1 - s)) * .5 + .5;
      var ab = E * (.045 + rnd() * .04);
      cx.strokeStyle = 'rgba(228,222,240,' + (.4 + rnd() * .45).toFixed(2) + ')';
      cx.lineWidth = E * .008;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(x - ab, y0 + ab * .3 * bat);
      cx.quadraticCurveTo(x - ab * .3, y0 - ab * .6 * bat, x, y0 - ab * .2);
      cx.quadraticCurveTo(x + ab * .3, y0 - ab * .6 * bat, x + ab, y0 + ab * .3 * bat);
      cx.stroke();
    }
  }


  /* ============ la calesita ============ */
  function calesita(cx, E, t) {
    var giro = t * .38;
    halo(cx, 0, -E * .1, E * 1.5, '255,200,140', .13);

    // Plataforma.
    cx.fillStyle = '#3a2f46';
    cx.beginPath();
    cx.ellipse(0, E * .58, E * .86, E * .11, 0, 0, 6.2832);
    cx.fill();
    cx.strokeStyle = 'rgba(220,180,120,.45)';
    cx.lineWidth = E * .012;
    cx.stroke();

    // Mastil.
    cx.fillStyle = '#4a3c56';
    cx.fillRect(-E * .022, -E * .90, E * .044, E * 1.48);

    // Los caballitos: los de atras primero, para que los tape el mastil.
    var lista = [];
    for (var k = 0; k < 6; k++) {
      var a = giro + k / 6 * 6.2832;
      lista.push({ a: a, z: Math.sin(a) });
    }
    lista.sort(function (p, q) { return p.z - q.z; });
    lista.forEach(function (c) {
      var x = Math.cos(c.a) * E * .62;
      var esc = .78 + c.z * .22;
      // Suben y bajan, cada uno en su fase.
      var y = E * (.08 + c.z * .07) + Math.sin(t * 2.2 + c.a) * E * .07;
      cx.save();
      cx.translate(x, y);
      cx.scale(esc, esc);
      // Barra.
      cx.strokeStyle = 'rgba(226,200,150,.7)';
      cx.lineWidth = E * .016;
      cx.beginPath();
      cx.moveTo(0, -E * .56); cx.lineTo(0, E * .42);
      cx.stroke();
      // Cuerpo del caballito.
      cx.fillStyle = '#c9b08a';
      cx.beginPath();
      cx.ellipse(0, E * .10, E * .13, E * .075, -.12, 0, 6.2832);
      cx.fill();
      // Cuello y cabeza.
      cx.beginPath();
      cx.moveTo(E * .08, E * .06);
      cx.quadraticCurveTo(E * .17, E * .0, E * .16, -E * .08);
      cx.lineTo(E * .21, -E * .09);
      cx.quadraticCurveTo(E * .19, E * .02, E * .11, E * .10);
      cx.closePath(); cx.fill();
      // Patas.
      cx.strokeStyle = '#b09a76';
      cx.lineWidth = E * .016;
      cx.lineCap = 'round';
      [-.07, .05].forEach(function (px) {
        cx.beginPath();
        cx.moveTo(E * px, E * .15);
        cx.lineTo(E * (px - .02), E * .27);
        cx.stroke();
      });
      cx.restore();
    });

    // Techo conico a franjas.
    for (var i = 0; i < 16; i++) {
      var a0 = i / 16 * 6.2832 + giro * .3;
      var a1 = (i + 1) / 16 * 6.2832 + giro * .3;
      cx.fillStyle = (i % 2) ? '#8f3murky' : '#8f3a48';
      cx.fillStyle = (i % 2) ? '#a8465a' : '#efe4d2';
      cx.beginPath();
      cx.moveTo(0, -E * .94);
      cx.lineTo(Math.cos(a0) * E * .92, Math.sin(a0) * E * .11 - E * .52);
      cx.lineTo(Math.cos(a1) * E * .92, Math.sin(a1) * E * .11 - E * .52);
      cx.closePath(); cx.fill();
    }
    // Borde del techo con bombitas.
    cx.strokeStyle = 'rgba(240,220,180,.7)';
    cx.lineWidth = E * .014;
    cx.beginPath();
    cx.ellipse(0, -E * .52, E * .92, E * .11, 0, 0, 6.2832);
    cx.stroke();
    for (var b = 0; b < 12; b++) {
      var ab = b / 12 * 6.2832 + giro * .3;
      var pul = .5 + .5 * Math.sin(t * 2 + b);
      halo(cx, Math.cos(ab) * E * .92, Math.sin(ab) * E * .11 - E * .52,
           E * .05 * pul, '255,214,150', .55 * pul);
    }
    // Remate.
    cx.fillStyle = '#d8b878';
    cx.beginPath(); cx.arc(0, -E * .98, E * .035, 0, 6.2832); cx.fill();
  }

  /* ============ el circulo ============ */
  /* Un anillo de hongos en el pasto, visto en escorzo. El anillo es una elipse
     achatada porque el suelo se ve desde arriba; los de adelante van mas
     grandes y mas claros que los del fondo, que es lo unico que hace que un
     ovalo de cosas se lea como un circulo apoyado y no como un collar colgado.

     `hondo` va de 0 a 1 y es lo que este lugar esconde: los colores se van de
     rango, el aire se llena y el suelo late. No lo dibuja la anomalia porque
     lo que cambia no es algo que aparezca encima — es como se ve TODO, y eso
     solo lo puede hacer quien lo dibuja. */
  function circulo(cx, E, t, hondo, arbolito) {
    var h = Math.max(0, Math.min(1, hondo || 0));
    var ar = Math.max(0, Math.min(1, arbolito || 0));
    /* La respiracion: cuatro segundos por vuelta, que es el ritmo al que se
       respira para salir de un ataque de panico y no un adorno. Todo lo que
       calma en esta escena late con esto. */
    var respira = (Math.sin(t * 1.55) + 1) / 2;
    /* El anillo se cierra un poco. Es lo que angustia de verdad: no el color
       sino que el lugar se achique alrededor mientras uno esta adentro. Un
       primer intento subio la saturacion hasta el magenta y quedaba una
       fiesta, no un mal momento — el color puro se lee como alegre por mas
       que uno lo llame caos. */
    var rx = E * (.92 - h * .13), ry = E * (.34 - h * .05), cy = E * .70;
    /* Tres hongos y no quince. Con quince el anillo era una cerca y el ojo se
       iba a contarlos; el circulo no lo hacen ellos, lo hace la marca en el
       pasto — que es lo que pasa en un corro de verdad, donde lo que se ve
       todo el año es el anillo de pasto distinto y los hongos salen unos
       pocos dias. Y deja lugar para lo que importa, que esta en el medio. */
    var N = 3;

    /* El pasto de adentro es de otro verde que el de afuera, que es lo que el
       texto dice y lo que pasa de verdad en un corro: el micelio se come el
       suelo y lo que crece encima cambia de color. */
    var suelo = cx.createRadialGradient(0, cy, E * .1, 0, cy, rx * 1.05);
    suelo.addColorStop(0, 'rgba(' + Math.round(46 + h * 22) + ',' +
                             Math.round(74 - h * 18) + ',' +
                             Math.round(56 + h * 40) + ',' + (.42 + h * .22).toFixed(3) + ')');
    suelo.addColorStop(.72, 'rgba(' + Math.round(38 - h * 18) + ',' +
                             Math.round(60 - h * 34) + ',' +
                             Math.round(48 - h * 10) + ',' +
                             (.30 + h * .34).toFixed(3) + ')');
    suelo.addColorStop(1, 'rgba(30,48,42,0)');
    cx.save();
    cx.translate(0, cy); cx.scale(1, ry / rx);
    cx.fillStyle = suelo;
    cx.beginPath(); cx.arc(0, 0, rx * 1.05, 0, 6.2832); cx.fill();
    cx.restore();

    /* Y el aire se cierra encima. Nico pidio mas oscuro y mas sombrio, y lo
       que oscurece una escena no es bajarle el brillo a las cosas: es que la
       luz de alrededor se apague y quede solo lo que uno esta mirando.

       Ojo con el orden: esto entro primero con un `restore` de mas y un
       `save` duplicado alrededor, y como el contexto viene trasladado desde
       `pintar`, ese restore deshacia la traslacion del llamador — la sombra
       salia como un circulo gigante corrido y el anillo entero se iba a un
       rincon. Va entre el suelo y el resto, sin tocar ninguna transformacion
       que no sea suya. */
    if (h > .01) {
      cx.save();
      var sombra = cx.createRadialGradient(0, cy - E * .2, E * .35,
                                           0, cy - E * .2, E * 2.2);
      sombra.addColorStop(0, 'rgba(6,4,12,0)');
      sombra.addColorStop(.5, 'rgba(6,4,12,' + (h * .34).toFixed(3) + ')');
      sombra.addColorStop(1, 'rgba(4,3,10,' + (h * .72).toFixed(3) + ')');
      cx.fillStyle = sombra;
      cx.beginPath(); cx.arc(0, cy - E * .2, E * 2.2, 0, 6.2832); cx.fill();
      cx.restore();
    }

    /* Y el suelo late en colores que se corren.

       Aca hubo un ida y vuelta: primero era magenta puro y quedaba una fiesta,
       asi que lo apague; y apagado perdio lo psicodelico, que es justamente lo
       que el lugar tiene que ser. La salida no es subir la saturacion sino que
       el COLOR NO SE QUEDE QUIETO. Ocho anillos saliendo del centro, cada uno
       con su tono, y todos los tonos girando despacio: eso se lee psicodelico
       aunque cada anillo por separado sea tenue, y no se lee alegre, porque lo
       inquietante no es el color sino que no para de cambiar. */
    if (h > .01) {
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      cx.translate(0, cy); cx.scale(1, ry / rx);
      for (var o = 0; o < 8; o++) {
        var fase = ((t * (.30 + h * .55) + o / 8) % 1);
        var tono = Math.round((t * 26 + o * 44) % 360);
        cx.strokeStyle = 'hsla(' + tono + ',' + Math.round(58 + h * 38) + '%,' +
                         Math.round(54 + h * 10) + '%,' +
                         (h * .30 * (1 - fase) * (.4 + fase)).toFixed(3) + ')';
        cx.lineWidth = E * (.010 + fase * .030);
        cx.beginPath(); cx.arc(0, 0, rx * (.10 + fase * 1.25), 0, 6.2832); cx.stroke();
      }
      cx.restore();

      /* Y el aire de encima, con las mismas bandas pero acostadas: lo que
         hace psicodelica una escena es que el color se mueva por TODO y no
         solo por un objeto. Se corta contra la sombra del tunel, asi que
         queda adentro del cono de vision y no invade el resto del cuadro. */
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      /* Desenfocadas, o son platos apilados y no neblina. El gradiente les da
         el borde blando a los costados pero arriba y abajo la elipse corta en
         seco, y cinco elipses nitidas una sobre otra se leen como una pila de
         discos. Mismo remedio que el haz del faro: el filtro hace lo que
         apilar formas no puede. */
      if (typeof cx.filter === 'string') cx.filter = 'blur(' + (E * .07).toFixed(1) + 'px)';
      for (var w = 0; w < 5; w++) {
        var oy2 = cy - E * (.25 + w * .34) + Math.sin(t * .5 + w) * E * .05;
        var tw = Math.round((t * 21 + w * 62 + 190) % 360);
        var gw = cx.createLinearGradient(-rx * 1.3, oy2, rx * 1.3, oy2);
        gw.addColorStop(0, 'hsla(' + tw + ',60%,55%,0)');
        gw.addColorStop(.5, 'hsla(' + tw + ',85%,58%,' + (h * .17).toFixed(3) + ')');
        gw.addColorStop(1, 'hsla(' + ((tw + 60) % 360) + ',60%,55%,0)');
        cx.fillStyle = gw;
        cx.beginPath();
        cx.ellipse(Math.sin(t * .37 + w) * E * .2, oy2,
                   rx * 1.25, E * (.09 + w * .015), 0, 0, 6.2832);
        cx.fill();
      }
      cx.restore();
    }

    /* El arbol del medio.

       Grande y GORDO, que es lo que Nico pidio y lo que el texto necesita: ella
       lo abraza, asi que el tronco tiene que ser de abrazar — no una rama
       parada. El primero media .86E de alto con un tronco de .038E y se veia
       escualido, un arbolito de vivero al lado del que hace falta ahi.

       Aparece ultimo y es lo unico de la escena que no esta mal: crece del
       centro del circulo, respira despacio y su luz es la unica calida que
       queda cuando todo lo demas se puso frio y se puso a girar de color. */
    {
      /* El arbol esta SIEMPRE, no solo al revelar.

         Antes aparecia recien pasado el 60% y el lugar sin revelar eran tres
         hongos chiquitos y una mancha de pasto — al lado del faro o de la
         casa, no habia figura. Ahora `ar` no decide si el arbol existe: decide
         cuanto se le NOTA. Quieto y apagado mientras nada pasa; respirando y
         encendido cuando ella se queda mirando, que es lo que el texto dice
         que ve. */
      var alt = E * (1.42 + respira * .045 * ar);
      var gordo = E * (.155 + respira * .006 * ar);   // medio tronco
      var abre = E * .62;
      cx.save();

      /* La luz que da, que late con la respiracion y no con el corazon. Con
         el lugar sin revelar es apenas un resplandor; lo que crece con `ar` es
         cuanto se enciende, no el arbol. */
      halo(cx, 0, cy - alt * .58, E * (1.02 + respira * .16 * ar),
           '240,218,168', .045 + ar * (.065 + respira * .10));

      /* El tronco, con cuerpo: dos lados que se abren abajo en raices y se
         cierran arriba. Dibujado como una sola forma rellena y no como una
         linea gruesa, porque una linea no tiene raiz ni se ensancha. */
      cx.beginPath();
      cx.moveTo(-gordo * 1.85, cy + E * .015);
      cx.quadraticCurveTo(-gordo * 1.05, cy - alt * .10, -gordo * .82, cy - alt * .34);
      cx.quadraticCurveTo(-gordo * .66, cy - alt * .60, -gordo * .40, cy - alt * .78);
      cx.lineTo(gordo * .40, cy - alt * .78);
      cx.quadraticCurveTo(gordo * .66, cy - alt * .60, gordo * .82, cy - alt * .34);
      cx.quadraticCurveTo(gordo * 1.05, cy - alt * .10, gordo * 1.85, cy + E * .015);
      cx.closePath();
      var corteza = cx.createLinearGradient(-gordo * 1.8, 0, gordo * 1.8, 0);
      corteza.addColorStop(0, 'rgba(96,74,58,.96)');
      corteza.addColorStop(.42, 'rgba(168,136,102,.96)');
      corteza.addColorStop(1, 'rgba(88,68,54,.96)');
      cx.fillStyle = corteza;
      cx.fill();

      // Las vetas, que es lo que termina de darle grosor a un tronco.
      cx.strokeStyle = 'rgba(70,54,44,.34)';
      cx.lineWidth = E * .008;
      for (var v2 = -1; v2 <= 1; v2++) {
        cx.beginPath();
        cx.moveTo(v2 * gordo * .62, cy);
        cx.quadraticCurveTo(v2 * gordo * .5, cy - alt * .38,
                            v2 * gordo * .34, cy - alt * .72);
        cx.stroke();
      }

      /* Las ramas: gruesas donde nacen y finas en la punta, con la punta
         encendida. Salen bien arriba para que el tronco quede libre y se lea
         el lugar donde ella lo abraza. */
      var rnd2 = sembrado(17);
      for (var b = 0; b < 8; b++) {
        var lado2 = b % 2 ? 1 : -1;
        var u2 = .74 + Math.floor(b / 2) * .075;
        var y0b = cy - alt * u2;
        var largoR = abre * (.55 + rnd2() * .55) * (1.25 - u2 * .5);
        var yFin = y0b - alt * (.12 + rnd2() * .10);
        cx.strokeStyle = 'rgba(150,122,94,' + (.78 + rnd2() * .18).toFixed(2) + ')';
        cx.lineWidth = E * (.030 - (u2 - .74) * .09);
        cx.lineCap = 'round';
        cx.beginPath();
        cx.moveTo(lado2 * gordo * .30, y0b);
        cx.quadraticCurveTo(lado2 * largoR * .62, y0b - alt * .03,
                            lado2 * largoR, yFin);
        cx.stroke();
        halo(cx, lado2 * largoR, yFin, E * .07 * (.7 + respira * .5 * ar),
             '248,228,180', .10 + ar * (.18 + respira * .22));
      }

      /* La copa: verde propio y no un resplandor crema. Es lo unico vivo del
         cuadro y tiene que verse vivo. Respira con el resto. */
      var copaR = abre * (1.22 + respira * .06);
      var copa = cx.createRadialGradient(0, cy - alt * .92, copaR * .1,
                                         0, cy - alt * .92, copaR);
      copa.addColorStop(0, 'rgba(120,168,116,' + (.30 + respira * .10 * ar).toFixed(3) + ')');
      copa.addColorStop(.55, 'rgba(84,132,96,' + (.18 + respira * .07 * ar).toFixed(3) + ')');
      copa.addColorStop(1, 'rgba(70,112,88,0)');
      cx.fillStyle = copa;
      cx.beginPath();
      cx.ellipse(0, cy - alt * .92, copaR, copaR * .78, 0, 0, 6.2832);
      cx.fill();

      /* Y las raices, que lo terminan de plantar. Cortas y cayendo: salieron
         primero largas y casi horizontales y parecian una barra clavada de
         lado a lado atravesando el tronco. Una raiz se hunde, no cruza. */
      cx.strokeStyle = 'rgba(92,72,58,.58)';
      cx.lineCap = 'round';
      for (var rz = 0; rz < 4; rz++) {
        var ld = rz % 2 ? 1 : -1;
        var lejos = gordo * (1.5 + (rz > 1 ? .55 : 0));
        cx.lineWidth = E * (.019 - (rz > 1 ? .006 : 0));
        cx.beginPath();
        cx.moveTo(ld * gordo * .8, cy - E * .02);
        cx.quadraticCurveTo(ld * lejos, cy + E * .004,
                            ld * lejos * 1.12, cy + E * .045);
        cx.stroke();
      }
      cx.restore();
    }

    // Los hongos, del fondo hacia adelante para que se tapen bien.
    var orden = [];
    for (var i = 0; i < N; i++) orden.push(i);
    orden.sort(function (a, b) {
      return Math.cos(a / N * 6.2832) - Math.cos(b / N * 6.2832);
    });
    var rnd = sembrado(61);
    var semilla = [];
    for (var g = 0; g < N; g++) semilla.push([rnd(), rnd(), rnd()]);

    /* Y los hongos, al PIE del arbol y no formando un anillo.

       El anillo era el tema del lugar cuando el arbol no estaba; ahora el
       tema es el arbol, y tres hongos separados no forman ningun circulo —
       forman tres puntos sueltos. Agrupados abajo son lo que son de verdad:
       lo que crece al pie de un arbol viejo. */
    var AL_PIE = [[-.62, .04, 1], [.50, -.02, .82], [-.20, .10, .66]];
    orden.forEach(function (i) {
      var puesto = AL_PIE[i % AL_PIE.length];
      var sx = puesto[0] * rx;
      var sy = cy + puesto[1] * E;
      var cerca = puesto[2];
      var esc = .70 + cerca * .45;
      var sem = semilla[i];
      /* Respiran: se estiran y se encogen, todos a destiempo. Con `hondo` el
         desfase se achica y empiezan a hacerlo juntos, que es lo que vuelve
         raro un movimiento que era apenas lindo. */
      var propio = sem[0] * 6.28 * (1 - h * .92);
      var late = 1 + Math.sin(t * (1.1 + h * 1.9) + propio) * (.05 + h * .10);
      var alto = E * (.17 + sem[1] * .09) * esc * late;
      var ancho = E * (.105 + sem[2] * .045) * esc * late;

      cx.save();
      cx.translate(sx, sy);

      // Tallo.
      cx.strokeStyle = 'rgba(' + Math.round(232 - h * 30) + ',' +
                       Math.round(226 - h * 20) + ',208,' + (.82 + cerca * .12).toFixed(2) + ')';
      cx.lineWidth = ancho * .30;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.quadraticCurveTo(ancho * .10, -alto * .55, 0, -alto * .92);
      cx.stroke();

      /* El sombrero. El color se va de rango con `hondo`: del ocre tranquilo
         de un hongo de campo a un violeta que ningun hongo tiene. No pasa a
         ser fosforescente de golpe — se corre, que es distinto y es lo que se
         recuerda de un color asi. */
      /* El color no se va al neon: se ENSUCIA. Del ocre tranquilo de un
         hongo de campo a un violeta apagado y frio, del lado del indigo del
         juego. Lo que se recuerda de un color asi no es que brillara, es que
         estaba mal — y un color que esta mal es uno que perdio la luz, no uno
         que la gano. */
      var rr = Math.round(196 - h * 62), gg = Math.round(150 - h * 44),
          bb = Math.round(118 + h * 86);
      var som = cx.createLinearGradient(0, -alto * 1.32, 0, -alto * .86);
      som.addColorStop(0, 'rgba(' + rr + ',' + Math.min(255, gg + 40) + ',' + bb + ',.96)');
      som.addColorStop(1, 'rgba(' + Math.round(rr * .72) + ',' +
                        Math.round(gg * .72) + ',' + Math.round(bb * .78) + ',.94)');
      cx.fillStyle = som;
      cx.beginPath();
      cx.ellipse(0, -alto * .92, ancho, alto * .42, 0, Math.PI, 0);
      cx.closePath(); cx.fill();
      // Los puntos del sombrero.
      cx.fillStyle = 'rgba(246,242,228,' + (.72 + h * .20).toFixed(2) + ')';
      for (var d = 0; d < 3; d++) {
        var px2 = (d - 1) * ancho * .42, py2 = -alto * (1.04 + (d % 2) * .09);
        cx.beginPath();
        cx.ellipse(px2, py2, ancho * .11, ancho * .075, 0, 0, 6.2832);
        cx.fill();
      }
      // Y lo que cada uno tira sobre el pasto.
      halo(cx, 0, -alto * .5, ancho * (2.1 + h * .7),
           rr + ',' + Math.min(255, gg + 60) + ',' + bb, .10 + h * .07);
      cx.restore();
    });

    // Y al final, con el lugar ya dibujado, se le cambia el color a todo.
    tenirCirculo(cx, E, t, h, cy, rx);
  }

  /* La capa que tiñe el lugar entero.

     Todo lo anterior agregaba luces de colores ENCIMA de las cosas, y eso se
     ve como una escena normal con luces. Lo que hace que una escena parezca
     vista de otra manera es que las cosas MISMAS cambien de color: el pasto,
     los hongos, la corteza. Eso no se dibuja sumando: se hace con los modos
     de fusion `saturation` y `hue`, que toman lo que ya esta pintado y le
     cambian la saturacion y el tono dejandole la luminancia — o sea las
     formas se reconocen igual y los colores no son los de nadie.

     Va con gradiente y no con color plano para no tener que recortar: el
     efecto se desvanece solo hacia los bordes y no deja el filo de un clip.

     Se llama al final del pintor, cuando el lugar ya esta dibujado. */
  function tenirCirculo(cx, E, t, h, cy, rx) {
    if (!(h > .01)) return;
    var y = cy - E * .30, r = E * 2.0;
    function capa(modo, tono, alfa) {
      var g = cx.createRadialGradient(0, y, E * .15, 0, y, r);
      g.addColorStop(0, 'hsla(' + tono + ',100%,50%,' + alfa.toFixed(3) + ')');
      g.addColorStop(.62, 'hsla(' + tono + ',100%,50%,' + (alfa * .72).toFixed(3) + ')');
      g.addColorStop(1, 'hsla(' + tono + ',100%,50%,0)');
      cx.globalCompositeOperation = modo;
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(0, y, r, 0, 6.2832); cx.fill();
    }
    cx.save();
    // Primero saturar, que es lo que saca a los colores de su sitio.
    capa('saturation', 0, h * .96);
    /* Y despues `color`, que cambia el tono Y la saturacion de una — `hue`
       solo corria el tono y el resultado quedaba timido, con el arbol
       marron y los hongos grises debajo de unas luces de colores. Con
       `color` la corteza deja de ser corteza.

       Dos capas girando a distinta velocidad y no una: con una sola la escena
       queda teñida de un color parejo, que se lee como un filtro de fotos.
       Con dos, cada parte del cuadro va por su lado y ningun color se queda
       quieto, que es lo unico que separa esto de una foto con filtro. */
    capa('color', Math.round((t * 23) % 360), h * .78);
    capa('color', Math.round((t * 41 + 140) % 360), h * .42);
    /* Y un ultimo pase de luz que muerde: `overlay` empuja lo claro hacia el
       color y deja lo oscuro donde esta, asi que el arbol y los hongos se
       encienden y el fondo no. */
    capa('overlay', Math.round((t * 17 + 60) % 360), h * .40);
    cx.restore();
  }

  /* ============ el faro ============ */
  /* `mira` va de 0 a 1 y es lo que este lugar esconde: el haz deja de barrer
     el campo y se queda quieto encima de ella.

     Va aca, y no en la anomalia, por la misma razon que las vias y el
     platillo. Antes la anomalia dibujaba su propio cono desde la linterna
     hasta Bel, y ese cono convivia con el haz que seguia girando: en pantalla
     se veian DOS luces distintas saliendo del mismo farol, una fija y una que
     pasaba de largo. Un faro tiene una lampara. Frenar un haz es frenarlo, no
     dibujar otro al lado que este quieto.

     `bel` es {dx, dy} en unidades de E, medido desde donde nace el haz: el
     pintor no sabe donde esta ella, se lo dice el motor, que es el unico que
     conoce el cuadro entero. */
  function faro(cx, E, t, mira, bel) {
    var m = Math.max(0, Math.min(1, mira || 0));
    if (!bel) m = 0;
    var giro = t * .55;
    /* El angulo del barrido en el que el haz sale para el lado de ella. No es
       el angulo hacia ella —ese es la inclinacion, mas abajo— sino en que
       punto de la vuelta se lo frena: de .60 de frente y .80 de lado, que es
       donde el haz esta abierto y todavia brilla. Mas de perfil se apagaria. */
    var dirBel = m > 0 && bel.dx < 0 ? -1 : 1;
    /* Y no frena del todo: llega hasta .92 y no hasta 1, asi que el barrido
       nunca se clava — sigue derivando despacio. El texto dice que el haz
       "frena un segundo de mas cuando me pasa por encima", no que se quede
       fijo apuntandola: un reflector de teatro es otra cosa, y encima delata
       de una lo que el lugar tendria que dejar entrever.

       El numero sale de la cuenta, no del gusto: el barrido gira a .55 rad/s,
       asi que lo que queda sin frenar deriva a .55*(1-q). Con .72 daban casi
       9 grados por segundo — 26 en los tres que dura la revelacion, y el haz
       se le iba de encima antes de que ella terminara de mirar. Con .92 son
       2,5 por segundo: se mueve lo suficiente para no parecer clavado y lo
       poco necesario para no perderla. */
    var q = m * .92;
    var angPara = Math.atan2(dirBel * .80, .60);
    /* Y la inclinacion: cuanto hay que bajar el haz, que sale horizontal, para
       que toque el piso donde esta ella. Medida desde el eje del propio haz,
       asi que va al reves cuando apunta para el otro lado. */
    /* Y el eje del cono no le cae encima: pasa unos grados mas alla, asi ella
       queda en el flanco de la luz y no en el medio. Que el maximo del haz
       coincida exacto con donde esta parada es lo que lo hacia obvio.

       Nueve grados y no cinco, ahora que el cono se abrio a casi treinta:
       corrido de a poco, un haz ancho vuelve a tener el maximo justo encima
       suyo y el corrimiento no se nota. Lo que hace falta correrlo depende de
       lo ancho que sea. */
    var inclBel = m > 0
      ? Math.atan2(bel.dy * dirBel, bel.dx * dirBel) + .157 * dirBel : 0;
    /* Un tercio mas largo que la distancia hasta ella: asi el haz no termina
       en un borde recto justo encima suyo, sino que la pasa apagandose. Lo que
       la alcanza es la parte del cono que todavia tiene cuerpo. */
    var largoBel = m > 0 ? Math.sqrt(bel.dx * bel.dx + bel.dy * bel.dy) * 1.34 : 0;
    /* Donde termina cada uno de los dos haces despues del frenado. Se saca
       aca afuera porque no lo usa solo el haz: la linterna necesita saber si
       la luz viene hacia el que mira o se esta yendo para el otro lado. */
    function anguloDe(d) {
      var a = giro + d * Math.PI;
      if (m > 0) {
        var falta = (angPara + d * Math.PI) - a;
        a += Math.atan2(Math.sin(falta), Math.cos(falta)) * q;
      }
      return a;
    }
    var deFrente = Math.max(0, Math.cos(anguloDe(0)), Math.cos(anguloDe(1)));

    // Dos haces opuestos que barren. De cada uno solo se ve la parte que
    // apunta hacia adelante. Van en cuatro capas concentricas, de la mas ancha
    // y tenue a la mas fina y brillante: eso le da el borde blando.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    /* Y un desenfoque de verdad sobre el haz.

       Cada capa es un trapecio de borde recto, y apilarlas deja escalones: en
       un corte transversal se contaban 210 quiebres de pendiente, que en
       pantalla son las bandas que se ven en la parte tenue. Difuminarlo
       sumando capas es aproximar un degradado con escalones cada vez mas
       finos; con el filtro no hay escalones que aproximar. Va aca adentro del
       save, asi que no toca nada mas de la figura. */
    var borroso = typeof cx.filter === 'string';
    if (borroso) cx.filter = 'blur(' + (E * .05).toFixed(1) + 'px)';
    if (m > 0) { cx.translate(0, -E * .57); cx.rotate(inclBel * q); cx.translate(0, E * .57); }
    for (var d = 0; d < 2; d++) {
      /* Frenar no es congelar de golpe: el haz sigue viniendo de donde venia y
         se va quedando. Por el camino corto, para que no pegue la vuelta
         entera para llegar a un angulo que tenia al lado. */
      var ang = anguloDe(d);
      var frente = Math.cos(ang);
      if (frente <= .05) continue;
      var lado = Math.sin(ang);
      var dir = lado >= 0 ? 1 : -1;
      var y0 = -E * .57;
      var largo = E * 2.6 * (1 - m) + E * largoBel * m;

      /* Cuatro capas, que con el desenfoque puesto alcanzan y sobran. Fueron
         ocho mientras el degradado transversal habia que fabricarlo apilando
         escalones; ahora las capas solo dan el nucleo mas vivo en el medio, y
         el borde blando lo hace el filtro. Cuatro fills borrosos por cuadro en
         vez de ocho. */
      for (var capa = 0; capa < 4; capa++) {
        var k = 1 - capa * .23;              // de 1 a .31
        /* Y sin subirle el brillo al frenar. Con `lighter` cualquier subida
           se va a blanco, y un haz que ademas de quedarse se enciende da dos
           veces la misma noticia. */
        var fuerza = (.052 + capa * .052) * frente;
        /* Y al frenar se ABRE, no se cierra. Cerrarlo fue el error de la
           vuelta anterior: un cono angosto es un reflector que apunta, y
           apuntar era justo lo que habia que dejar de hacer. Abierto, la luz
           no señala un punto — baña un pedazo de campo, y ella esta adentro
           de ese pedazo. */
        var altoFin = E * (.34 + Math.abs(lado) * .52) * k * (1 + m * .62);
        var g = cx.createLinearGradient(0, y0, largo * dir, y0);
        g.addColorStop(0, 'rgba(255,244,212,' + (fuerza * 1.7).toFixed(3) + ')');
        g.addColorStop(.18, 'rgba(255,240,200,' + (fuerza * .92).toFixed(3) + ')');
        g.addColorStop(.35, 'rgba(255,236,190,' + (fuerza * .55).toFixed(3) + ')');
        g.addColorStop(.58, 'rgba(255,234,186,' + (fuerza * .27).toFixed(3) + ')');
        // Muere antes del borde: un haz cortado por el marco no parece luz.
        // Muere antes del borde: un haz cortado por el marco no parece luz.
        // Frenado se apaga igual, solo que un poco mas tarde, porque lo que
        // tiene que alcanzar —ella— esta antes de que el cono se acabe.
        g.addColorStop(.8, 'rgba(255,232,182,' + (fuerza * (.08 + m * .10)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,230,180,0)');
        cx.fillStyle = g;
        cx.beginPath();
        cx.moveTo(0, y0 - E * .07 * k);
        cx.lineTo(0, y0 + E * .07 * k);
        cx.lineTo(largo * dir, y0 + altoFin);
        cx.lineTo(largo * dir, y0 - altoFin);
        cx.closePath();
        cx.fill();
      }
    }
    cx.restore();

    // Torre a franjas, mas angosta arriba.
    var pasos = 12;
    for (var i = 0; i < pasos; i++) {
      var u0 = i / pasos, u1 = (i + 1) / pasos;
      var an0 = E * (.30 - u0 * .13), an1 = E * (.30 - u1 * .13);
      var yA = E * (1 - u0 * 1.42), yB = E * (1 - u1 * 1.42);
      cx.fillStyle = (i % 2) ? '#b8354a' : '#e6ded0';
      cx.beginPath();
      cx.moveTo(-an0, yA); cx.lineTo(an0, yA);
      cx.lineTo(an1, yB); cx.lineTo(-an1, yB);
      cx.closePath(); cx.fill();
    }
    // Sombra a los costados: sin esto la torre es un trapecio, no un cilindro.
    var som = cx.createLinearGradient(-E * .30, 0, E * .30, 0);
    som.addColorStop(0, 'rgba(10,10,26,.45)');
    som.addColorStop(.40, 'rgba(10,10,26,0)');
    som.addColorStop(1, 'rgba(10,10,26,.30)');
    cx.fillStyle = som;
    cx.beginPath();
    cx.moveTo(-E * .30, E); cx.lineTo(E * .30, E);
    cx.lineTo(E * .17, -E * .42); cx.lineTo(-E * .17, -E * .42);
    cx.closePath(); cx.fill();

    // Balcon.
    cx.fillStyle = '#2e2838';
    cx.fillRect(-E * .25, -E * .46, E * .50, E * .06);
    /* Linterna. Adentro no esta todo encendido.

       Era un rectangulo de relleno casi blanco y parejo, de lado a lado, y eso
       tiene dos problemas. Uno: un faro no es una caja de luz, es una lampara
       adentro de una caja de vidrio, y lo que se ve son las dos cosas — el
       nucleo brillante y el resto en penumbra. Dos: cualquier cosa que se
       dibuje ahi adentro queda recortada contra el blanco mas fuerte de toda
       la pantalla, que es exactamente lo que hacia que la silueta se leyera de
       una en vez de entreverse. */
    var lx0 = -E * .17, ly0 = -E * .72, lw = E * .34, lh = E * .28;
    // El interior en sombra, que es el estado por defecto de adentro de algo.
    cx.fillStyle = 'rgba(30,24,40,.95)';
    cx.fillRect(lx0, ly0, lw, lh);
    /* Y la lampara: un nucleo arriba, no el vidrio entero. Va arriba a
       proposito — abajo esta el piso de la linterna, que es donde se para
       cualquiera que este ahi, y esa mitad tiene que quedar en penumbra. */
    cx.save();
    cx.beginPath(); cx.rect(lx0, ly0, lw, lh); cx.clip();
    var nucleo = cx.createRadialGradient(0, ly0 + lh * .34, 0,
                                         0, ly0 + lh * .34, lh * .95);
    /* Cuanto se la ve encendida depende de si el haz viene hacia el que mira
       o se esta yendo: de frente enciende, de perfil baja. Pero baja, no se
       apaga — la lampara de un faro esta prendida siempre, lo que cambia es
       cuanta luz te llega. Con el piso en .34 el faro sin revelar quedaba
       marron y muerto la mitad del tiempo, porque de perfil `deFrente` cae a
       .08. Lo que separa la silueta del fondo no es esto: es que el nucleo
       este arriba y ella abajo. */
    var vivo = .60 + .40 * deFrente;
    nucleo.addColorStop(0, 'rgba(255,250,226,' + (.96 * vivo).toFixed(3) + ')');
    nucleo.addColorStop(.42, 'rgba(255,226,164,' + (.62 * vivo).toFixed(3) + ')');
    nucleo.addColorStop(1, 'rgba(255,196,110,0)');
    cx.fillStyle = nucleo;
    cx.fillRect(lx0, ly0, lw, lh);
    cx.restore();
    cx.strokeStyle = '#2e2838';
    cx.lineWidth = E * .016;
    cx.strokeRect(lx0, ly0, lw, lh);
    halo(cx, 0, -E * .58, E * .60, '255,232,170', .42 + .30 * deFrente);
    // Cupula.
    cx.fillStyle = '#2e2838';
    cx.beginPath();
    cx.ellipse(0, -E * .72, E * .20, E * .13, 0, Math.PI, 0);
    cx.closePath(); cx.fill();

    // Rocas al pie: un faro plantado en el pasto se ve pegado.
    var rndR = sembrado(31);
    for (var rk = 0; rk < 9; rk++) {
      var rx = (rndR() * 2 - 1) * E * .62;
      var ry = E * (.94 + rndR() * .07);
      var rw = E * (.07 + rndR() * .11);
      cx.fillStyle = 'rgba(46,42,58,' + (.55 + rndR() * .35).toFixed(2) + ')';
      cx.beginPath();
      cx.ellipse(rx, ry, rw, rw * (.5 + rndR() * .25), rndR() * .6, 0, 6.2832);
      cx.fill();
      cx.strokeStyle = 'rgba(150,140,180,.13)';
      cx.lineWidth = E * .006;
      cx.stroke();
    }
  }

  /* ============ la laguna ============ */
  function laguna(cx, E, t) {
    // El agua: una banda que se abre hacia el frente.
    var ag = cx.createLinearGradient(0, E * .28, 0, E);
    ag.addColorStop(0, '#151a34');
    ag.addColorStop(.5, '#1b2244');
    ag.addColorStop(1, '#242c58');
    cx.fillStyle = ag;
    cx.beginPath();
    cx.moveTo(-E * .32, E * .28); cx.lineTo(E * .32, E * .28);
    cx.lineTo(E * 1.7, E); cx.lineTo(-E * 1.7, E);
    cx.closePath(); cx.fill();

    // La orilla del fondo.
    cx.strokeStyle = 'rgba(150,140,200,.30)';
    cx.lineWidth = E * .01;
    cx.beginPath();
    cx.moveTo(-E * .32, E * .28); cx.lineTo(E * .32, E * .28);
    cx.stroke();

    // El reflejo de algo luminoso, quebrado por el oleaje.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    for (var r = 0; r < 13; r++) {
      var u = r / 12;
      var y = E * (.32 + u * u * .66);
      var an = E * (.03 + u * .13);
      var corr = Math.sin(t * 1.6 + r * .9) * E * .04 * u;
      var a = (.45 - u * .3) * (.7 + .3 * Math.sin(t * 2.4 + r));
      cx.fillStyle = 'rgba(240,240,215,' + a.toFixed(3) + ')';
      cx.beginPath();
      cx.ellipse(corr, y, an, E * .012, 0, 0, 6.2832);
      cx.fill();
    }
    cx.restore();

    // Juncos en la orilla: rompen la linea recta del agua.
    var rndJ = sembrado(23);
    for (var jn = 0; jn < 22; jn++) {
      var jx = (rndJ() * 2 - 1) * E * 1.5;
      // Solo a los costados: en el medio taparian el reflejo.
      if (Math.abs(jx) < E * .42) continue;
      var jy = E * (.34 + rndJ() * .52);
      var jalto = E * (.10 + rndJ() * .16);
      var jinc = (rndJ() - .5) * .5 + Math.sin(t * .6 + jn) * .07;
      cx.strokeStyle = 'rgba(58,74,64,' + (.35 + rndJ() * .35).toFixed(2) + ')';
      cx.lineWidth = E * .010;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(jx, jy);
      cx.quadraticCurveTo(jx + jinc * E * .06, jy - jalto * .6,
                          jx + jinc * E * .14, jy - jalto);
      cx.stroke();
    }

    // Lineas de oleaje.
    for (var i = 0; i < 15; i++) {
      var v = i / 14;
      var yy = E * (.34 + v * v * .64);
      var ancho = E * (.36 + v * 1.3);
      var trozos = 2 + Math.floor(v * 5);
      cx.strokeStyle = 'rgba(180,190,240,' + (.06 + v * .13).toFixed(3) + ')';
      cx.lineWidth = E * (.006 + v * .008);
      for (var k = 0; k < trozos; k++) {
        var paso = ancho * 2 / trozos;
        var x0 = -ancho + k * paso + Math.sin(t * 1.1 + i + k) * E * .03;
        cx.beginPath();
        cx.moveTo(x0, yy); cx.lineTo(x0 + paso * .6, yy);
        cx.stroke();
      }
    }
  }

  /* ============ la barca ============ */
  /* El mar y el temporal, debajo y alrededor de la barca.

     Se dibuja ANTES que ella y en coordenadas propias, para que la barca
     quede encima flotando y no adentro del agua. Las olas son cuatro filas de
     crestas a distinta velocidad: con una sola fila el agua se lee como una
     cinta que se desliza, y lo que hace mar es que las capas no vayan todas
     juntas. El relampago no es un flash blanco de pantalla —eso es un golpe
     en los ojos y encima taparia la escena— sino una subida de luz sobre el
     agua y la vela, que es lo que se ve de verdad cuando cae uno lejos. */
  function mar(cx, E, t) {
    /* La linea del agua va justo abajo del casco y no al pie del cuadro: la
       barca es de las figuras que vuelan —no apoya en el piso— asi que un mar
       dibujado abajo de todo la dejaba flotando un metro por encima del agua.
       El agua sigue despues hacia abajo hasta salirse del cuadro, que es lo
       que la hace mar y no una pileta. */
    var y0 = E * .17;
    cx.save();

    var ag = cx.createLinearGradient(0, y0 - E * .06, 0, y0 + E * 1.5);
    ag.addColorStop(0, 'rgba(38,48,92,.94)');
    ag.addColorStop(.35, 'rgba(28,36,72,.95)');
    ag.addColorStop(1, 'rgba(14,18,40,.97)');
    cx.fillStyle = ag;
    /* Ancho de sobra: con 4,8E el agua terminaba adentro del cuadro y se veian
       los dos cantos verticales, o sea una pileta y no un mar. */
    cx.fillRect(-E * 9, y0 - E * .06, E * 18, E * 3.2);

    /* El relampago: cada tanto, y no siempre en el mismo lado. La cuenta con
       seno elevado deja el destello corto y el resto del tiempo en cero. */
    /* Cuatro relampagos con periodos que no son multiplos entre si: asi caen
       seguido pero nunca a intervalos parejos, que es lo que separa una
       tormenta de una luz que parpadea. */
    var rayo = Math.pow(Math.max(0, Math.sin(t * .47)), 22) +
               Math.pow(Math.max(0, Math.sin(t * .31 + 2.1)), 28) +
               Math.pow(Math.max(0, Math.sin(t * .73 + 4.4)), 34) +
               Math.pow(Math.max(0, Math.sin(t * 1.09 + 1.2)), 44);
    if (rayo > .01) {
      var lx = Math.sin(t * .19) * E * 1.4;
      /* El resplandor tiene que apagarse ANTES del borde del rectangulo que
         lo lleva, o el corte se ve — y se veia: en el pico del relampago
         quedaba un rectangulo claro con dos cantos rectos en el medio del
         cielo. El radio del gradiente es 3,4E y el rectangulo mide 18 de
         ancho, asi que muere adentro. */
      var luz = cx.createRadialGradient(lx, y0 - E * 1.5, E * .1,
                                        lx, y0 - E * 1.5, E * 3.4);
      luz.addColorStop(0, 'rgba(196,208,255,' + (rayo * .26).toFixed(3) + ')');
      luz.addColorStop(.55, 'rgba(180,196,255,' + (rayo * .09).toFixed(3) + ')');
      luz.addColorStop(1, 'rgba(196,208,255,0)');
      cx.fillStyle = luz;
      cx.fillRect(-E * 9, y0 - E * 5, E * 18, E * 8);
    }

    /* Las olas: siete filas con CUERPO y no lineas sueltas.

       Dibujadas como trazos quedaban curvas de nivel de un mapa: el ojo ve
       lineas y no agua. Cada fila es ahora una franja rellena que baja desde
       su cresta hasta la fila siguiente, con la cresta marcada encima. El
       relleno es lo que hace volumen; el trazo solo, contorno. */
    for (var f = 0; f < 7; f++) {
      var yf = y0 + E * (.02 + f * f * .038);
      var vel = .85 + f * .42;
      var alto = E * (.026 + f * .017);
      var largo = E * (.24 + f * .10);
      var claro = .055 + f * .016 + rayo * .10;

      // El cuerpo de la ola.
      cx.fillStyle = 'rgba(' + Math.round(96 + f * 16) + ',' +
                     Math.round(126 + f * 20) + ',200,' + claro.toFixed(3) + ')';
      cx.beginPath();
      cx.moveTo(-E * 2.6, yf + E * .5);
      for (var x = -E * 2.6; x < E * 2.6; x += largo) {
        var fase = t * vel + x / largo;
        cx.lineTo(x, yf + Math.sin(fase) * alto);
        cx.quadraticCurveTo(x + largo * .5, yf + Math.cos(fase) * alto * 2.4,
                            x + largo, yf + Math.sin(fase + 1) * alto);
      }
      cx.lineTo(E * 2.6, yf + E * .5);
      cx.closePath();
      cx.fill();

      // Y la cresta, que es lo que se ve blanco cuando el agua esta picada.
      cx.strokeStyle = 'rgba(' + Math.round(150 + f * 14) + ',' +
                       Math.round(180 + f * 16) + ',238,' +
                       (.26 + f * .05 + rayo * .45).toFixed(3) + ')';
      cx.lineWidth = Math.max(1, E * (.010 + f * .004));
      cx.beginPath();
      for (var x2 = -E * 2.6; x2 < E * 2.6; x2 += largo) {
        var fa2 = t * vel + x2 / largo;
        cx.moveTo(x2, yf + Math.sin(fa2) * alto);
        cx.quadraticCurveTo(x2 + largo * .5, yf + Math.cos(fa2) * alto * 2.4,
                            x2 + largo, yf + Math.sin(fa2 + 1) * alto);
      }
      cx.stroke();
    }

    /* La lluvia. Cae inclinada y toda para el mismo lado: vertical se lee como
       nieve. Va por delante del agua y por detras de la barca. */
    var rnd = sembrado(53);
    cx.strokeStyle = 'rgba(180,200,245,.26)';
    cx.lineWidth = Math.max(1, E * .0055);
    cx.beginPath();
    for (var g = 0; g < 70; g++) {
      var bx = (rnd() * 2 - 1) * E * 2.1;
      var caida = ((t * (1.5 + rnd() * .9) + rnd() * 3) % 1);
      var gy = y0 - E * 2.1 + caida * E * 2.4;
      if (gy > y0 + E * .04) continue;
      cx.moveTo(bx, gy);
      cx.lineTo(bx - E * .045, gy + E * .12);
    }
    cx.stroke();
    cx.restore();
  }

  function barca(cx, E, t) {
    // El temporal va primero: la barca flota encima de el.
    mar(cx, E, t);
    /* Se mece fuerte, y de manera despareja.

       Era un solo seno de .045 radianes: dos grados y medio, siempre iguales,
       siempre a tiempo. Eso es un pendulo, no una tormenta — y el texto dice
       que se mece fuerte, "como si abajo hubiera una tormenta que solo ella
       siente". No lleva agua a proposito: el agua que falta ES lo raro del
       lugar. Lo que tiene que sentirse es la tormenta, no verse el mar.

       Tres senos de frecuencias que no son multiplos entre si suman siete
       grados y no repiten el mismo golpe: el ojo deja de poder anticipar el
       movimiento, que es lo unico que separa una sacudida de un vaiven. */
    /* Mas fuerte desde que hay agua abajo: antes se sacudia sobre la nada y
       pasarse de amplitud se veia raro; con olas debajo, lo raro seria que se
       moviera poco. Doce grados en vez de siete. */
    var mece = Math.sin(t * .7) * .085 + Math.sin(t * 1.63 + 1.1) * .075 +
               Math.sin(t * 2.9 + 2.3) * .045;
    var hincha = 1 + Math.sin(t * 1.37) * .085 + Math.sin(t * 3.1 + .8) * .035;
    cx.save();
    cx.rotate(mece);
    /* Y sube y baja con el agua: la vertical va a la misma frecuencia que la
       primera fila de olas, asi que la barca cabalga lo que tiene abajo en vez
       de moverse por su cuenta. */
    cx.translate(Math.sin(t * 1.21) * E * .030,
                 Math.sin(t * .85) * E * .055 + Math.sin(t * 2.2 + .7) * E * .022);

    // Vela.
    var vel = cx.createLinearGradient(0, -E * .84, E * .5, -E * .2);
    vel.addColorStop(0, 'rgba(238,230,214,.95)');
    vel.addColorStop(1, 'rgba(198,186,172,.85)');
    cx.fillStyle = vel;
    /* Y la vela trabaja: se hincha y afloja con el viento que no se ve. Una
       vela rigida arriba de un casco que se sacude se lee como un recorte de
       carton pegado al mastil. */
    cx.beginPath();
    cx.moveTo(0, -E * .86);
    cx.quadraticCurveTo(E * .46 * hincha, -E * .60, E * .52 * hincha, -E * .30);
    cx.quadraticCurveTo(E * .30 * hincha, -E * .20, 0, -E * .16);
    cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(120,110,100,.35)';
    cx.lineWidth = E * .006;
    for (var v = 1; v < 4; v++) {
      var f = v / 4;
      cx.beginPath();
      cx.moveTo(0, -E * .86 + f * E * .70);
      cx.quadraticCurveTo(E * .28 * hincha * (1 - f * .4), -E * .5 + f * E * .3,
                          E * .52 * hincha * (1 - f * .55), -E * .30 + f * E * .16);
      cx.stroke();
    }
    // Mastil.
    cx.strokeStyle = '#6b5238';
    cx.lineWidth = E * .022;
    cx.lineCap = 'round';
    cx.beginPath();
    cx.moveTo(0, E * .10); cx.lineTo(0, -E * .88);
    cx.stroke();

    // Casco.
    var cas = cx.createLinearGradient(0, E * .08, 0, E * .42);
    cas.addColorStop(0, '#7a5a3c');
    cas.addColorStop(1, '#402d1e');
    cx.fillStyle = cas;
    cx.beginPath();
    cx.moveTo(-E * .80, E * .10);
    cx.quadraticCurveTo(0, E * .56, E * .80, E * .10);
    cx.quadraticCurveTo(0, E * .24, -E * .80, E * .10);
    cx.closePath(); cx.fill();
    // Filo iluminado.
    cx.strokeStyle = 'rgba(226,200,160,.5)';
    cx.lineWidth = E * .014;
    cx.beginPath();
    cx.moveTo(-E * .80, E * .10);
    cx.quadraticCurveTo(0, E * .24, E * .80, E * .10);
    cx.stroke();
    // Remo.
    cx.strokeStyle = '#6b5238';
    cx.lineWidth = E * .016;
    cx.beginPath();
    cx.moveTo(-E * .60, -E * .04); cx.lineTo(-E * .94, E * .44);
    cx.stroke();
    cx.fillStyle = '#6b5238';
    cx.beginPath();
    cx.ellipse(-E * .95, E * .47, E * .06, E * .03, .95, 0, 6.2832);
    cx.fill();
    cx.restore();

    // Lo que deja en el agua.
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = 'rgba(180,200,255,.10)';
    cx.beginPath();
    cx.ellipse(0, E * .50, E * .86, E * .07, 0, 0, 6.2832);
    cx.fill();
    cx.restore();
  }

  /* ============ el reloj ============ */
  function reloj(cx, E, t) {
    halo(cx, 0, 0, E * 1.25, '230,215,255', .1);
    // Pie.
    cx.fillStyle = '#3a3048';
    cx.beginPath();
    cx.moveTo(-E * .20, E * .80); cx.lineTo(E * .20, E * .80);
    cx.lineTo(E * .34, E); cx.lineTo(-E * .34, E);
    cx.closePath(); cx.fill();
    // Caja.
    var caja = cx.createRadialGradient(-E * .3, -E * .34, E * .06, 0, 0, E * .84);
    caja.addColorStop(0, '#6f5e46');
    caja.addColorStop(.7, '#483c2e');
    caja.addColorStop(1, '#2c241c');
    cx.fillStyle = caja;
    cx.beginPath(); cx.arc(0, 0, E * .82, 0, 6.2832); cx.fill();
    // Esfera.
    var esf = cx.createRadialGradient(-E * .18, -E * .22, E * .05, 0, 0, E * .68);
    esf.addColorStop(0, '#f4eeda');
    esf.addColorStop(1, '#d6cdb4');
    cx.fillStyle = esf;
    cx.beginPath(); cx.arc(0, 0, E * .68, 0, 6.2832); cx.fill();
    cx.strokeStyle = 'rgba(60,48,34,.55)';
    cx.lineWidth = E * .014;
    cx.stroke();

    // Marcas.
    cx.strokeStyle = '#3a3026';
    cx.lineCap = 'round';
    for (var h = 0; h < 12; h++) {
      var a = h / 12 * 6.2832 - Math.PI / 2;
      var largo = (h % 3 === 0) ? .14 : .07;
      cx.lineWidth = (h % 3 === 0) ? E * .022 : E * .012;
      cx.beginPath();
      cx.moveTo(Math.cos(a) * E * .60, Math.sin(a) * E * .60);
      cx.lineTo(Math.cos(a) * E * (.60 - largo), Math.sin(a) * E * (.60 - largo));
      cx.stroke();
    }

    // Las agujas corren, y corren mal: es un sueno.
    var min = -Math.PI / 2 + t * .42;
    var hor = -Math.PI / 2 + t * .42 / 12 + 1.1;
    cx.strokeStyle = '#2b2219';
    cx.lineWidth = E * .030;
    cx.beginPath();
    cx.moveTo(0, 0); cx.lineTo(Math.cos(hor) * E * .34, Math.sin(hor) * E * .34);
    cx.stroke();
    cx.lineWidth = E * .020;
    cx.beginPath();
    cx.moveTo(0, 0); cx.lineTo(Math.cos(min) * E * .52, Math.sin(min) * E * .52);
    cx.stroke();
    // El segundero va al reves.
    cx.strokeStyle = 'rgba(170,60,50,.9)';
    cx.lineWidth = E * .010;
    var seg = -Math.PI / 2 - t * 1.6;
    cx.beginPath();
    cx.moveTo(0, 0); cx.lineTo(Math.cos(seg) * E * .56, Math.sin(seg) * E * .56);
    cx.stroke();
    cx.fillStyle = '#2b2219';
    cx.beginPath(); cx.arc(0, 0, E * .030, 0, 6.2832); cx.fill();

    // El pendulo, colgando del pie, con su vaiven propio.
    var osc = Math.sin(t * 1.15) * .34;
    cx.save();
    cx.translate(0, E * .80);
    cx.rotate(osc);
    cx.strokeStyle = '#6f5e46';
    cx.lineWidth = E * .012;
    cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, E * .30); cx.stroke();
    var gp = cx.createRadialGradient(-E * .02, E * .30, E * .01, 0, E * .32, E * .075);
    gp.addColorStop(0, '#e8c473');
    gp.addColorStop(1, '#9a7a34');
    cx.fillStyle = gp;
    cx.beginPath(); cx.arc(0, E * .32, E * .068, 0, 6.2832); cx.fill();
    cx.strokeStyle = 'rgba(60,48,34,.7)';
    cx.lineWidth = E * .010;
    cx.stroke();
    cx.restore();
  }

  var PINTORES = {
    platillo: platillo, luna: luna, ruina: ruina, arbol: arbol,
    cama: cama, puerta: puerta, casa: casa, bandada: bandada,
    calesita: calesita, faro: faro, laguna: laguna, barca: barca, reloj: reloj,
    circulo: circulo
  };

  /* La montaña rusa necesita su perfil, que lo tiene figuras.js. */
  /* extra: { perfil, alPiso } — el perfil lo necesita la montania, la
     distancia al piso la necesita el platillo para apoyar su haz. */
  function pintar(cx, clave, x, y, E, t, extra) {
    extra = extra || {};
    cx.save();
    cx.translate(x, y);
    if (clave === 'montania') montania(cx, E, t, extra.perfil, extra.corte);
    else if (clave === 'platillo') platillo(cx, E, t, extra.alPiso, extra.apaga);
    else if (clave === 'bandada') bandada(cx, E, t, extra.sincro);
    else if (clave === 'circulo') circulo(cx, E, t, extra.hondo, extra.arbol);
    else if (clave === 'faro') faro(cx, E, t, extra.mira, extra.haciaBel);
    else if (PINTORES[clave]) PINTORES[clave](cx, E, t);
    cx.restore();
  }

  return { pintar: pintar, halo: halo, PINTORES: PINTORES };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Pintores; }
