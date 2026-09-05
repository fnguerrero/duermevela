/* Quedarse mirando.

   Mientras las piezas vuelan, el lugar deja ver lo que esconde — pero solo a
   quien se queda. No hay que acertarle a nada: hay que apoyar el dedo y
   sostener. Un segundo. El que llegó tarde, o el que prefirió seguir de largo,
   simplemente no lo ve.

   Antes esto era un anillo que se cerraba sobre una marca y había que tocar en
   el momento justo. Andaba, pero medía reflejos: el juego decía "quedate
   mirando" y en realidad pedía puntería, y el tiempo corría a alguien que
   había venido a mirar tranquila. Ahora mirar es una decisión, no una
   habilidad, y por eso tampoco hay error: hay una cosa que se vio y otra por la
   que se pasó de largo, como en cualquier día.

   El anillo sigue estando, pero cambió de oficio: era un cronómetro y ahora es
   un medidor de cuánto se lleva mirando. */
var Instante = (function () {
  'use strict';

  // Dentro de la mutación (u de 0 a 1), cuándo se puede mirar.
  var ENTRA = .10;
  var CIERRA = .96;

  /* Cuánto hay que sostener, en segundos. Literalmente el segundo de más. */
  var SOSTENER = 1.0;

  /* Soltar no reinicia: el llenado baja mucho más despacio de lo que sube, así
     que apoyar, soltar y volver a apoyar suma igual. Solo se pierde por no
     quedarse, nunca por un dedo que resbala. */
  var SUBE = 1 / SOSTENER;
  var BAJA = .38;

  function crear() {
    return {
      activo: false,
      u: 0,             // progreso de la mutación, lo pone el juego
      resuelto: false,
      resultado: null,  // 'visto' | 'siguio'
      lleno: 0,         // cuánto se lleva mirando, de 0 a 1
      sosteniendo: false,
      destello: 0,      // brillo de haberlo visto
      fallo: 0,         // se conserva para el dibujo, ya casi no se usa
      // Dónde cae el anillo en pantalla; lo fija el juego al arrancar.
      x: 0, y: 0, radio: 120
    };
  }

  function arrancar(i, x, y, radio) {
    i.activo = true;
    i.resuelto = false;
    i.resultado = null;
    i.lleno = 0;
    i.sosteniendo = false;
    i.destello = 0;
    i.fallo = 0;
    i.x = x; i.y = y; i.radio = radio;
  }

  /* Cuánto lleva mirando, de 0 a 1. El juego lo usa para el sonido. */
  function avance(i) { return i.lleno; }
  function avanceVisible(i) { return Math.min(1, i.lleno); }

  /* Empieza y deja de mirar. Se puede llamar cuantas veces se quiera. */
  function apoyar(i) {
    if (!i.activo || i.resuelto) return false;
    i.sosteniendo = true;
    return true;
  }
  function soltar(i) {
    i.sosteniendo = false;
  }

  /* Se llama en cada cuadro con el progreso de la mutación. */
  function actualizar(i, u, dt) {
    i.u = u;
    if (i.destello > 0) i.destello = Math.max(0, i.destello - dt * 1.6);
    if (i.fallo > 0) i.fallo = Math.max(0, i.fallo - dt * 2.4);

    if (i.activo && !i.resuelto) {
      var puedeVer = u > ENTRA && u < CIERRA;
      if (i.sosteniendo && puedeVer) {
        i.lleno = Math.min(1, i.lleno + dt * SUBE);
        if (i.lleno >= 1) {
          i.resuelto = true;
          i.resultado = 'visto';
          i.destello = 1;
        }
      } else if (i.lleno > 0) {
        i.lleno = Math.max(0, i.lleno - dt * BAJA);
      }
      /* Si la transformación terminó sin que se quedara, siguió de largo. No
         es un error ni se lo trata como tal: es la otra opción. */
      if (!i.resuelto && u >= CIERRA) {
        i.resuelto = true;
        i.resultado = 'siguio';
      }
    }
    if (i.activo && u >= 1) i.activo = false;
  }

  function vio(i) { return i.resultado === 'visto'; }

  /* Se conserva el nombre viejo para no romper a quien lo llame. */
  function acerto(i) { return vio(i); }

  /* El color del anillo, en un solo lugar.

     Estaba escrito seis veces a mano y era el mismo dorado que el marcador, el
     rotulo, el chevron y la guia: lo unico que hay que mirar tenia el color de
     los carteles de la interfaz. Sacarlo afuera permite ademas compararlo sin
     tocar el dibujo — test/anillo.html cambia esto y renderiza al lado. */
  /* Turquesa frio, y no el dorado de antes.

     El anillo estaba pintado del mismo color que el marcador, el rotulo, el
     chevron y la guia: lo unico que hay que mirar tenia el color de los
     carteles de la interfaz. Este se despega de todos ellos y del fondo azul
     noche sin salirse de la paleta.

     Van saturados a proposito: el anillo se dibuja con globalCompositeOperation
     'lighter', asi que cualquier tono palido se suma hasta el blanco y el
     color se pierde. Comparalos en test/anillo.html. */
  var TINTA = {
    espera: '70,196,235',    // el aro que espera que apoyes
    lleno: '120,222,250',    // el arco que se va llenando
    cerca: '80,205,240',     // el resplandor de cuando esta por completarse
    vio: '150,235,255'       // el anillo que se abre al verlo
  };
  function tinta(nueva) {
    if (nueva) {
      Object.keys(nueva).forEach(function (k) { TINTA[k] = nueva[k]; });
    }
    return TINTA;
  }

  return {
    crear: crear, arrancar: arrancar, actualizar: actualizar,
    apoyar: apoyar, soltar: soltar,
    dibujar: dibujar,
    vio: vio, acerto: acerto, avance: avance, avanceVisible: avanceVisible,
    tinta: tinta,
    ENTRA: ENTRA, CIERRA: CIERRA, SOSTENER: SOSTENER
  };

  /* ---------- dibujo ---------- */

  function dibujar(cx, i, t) {
    if (!i.activo && i.destello <= 0) return;
    cx.save();
    cx.globalCompositeOperation = 'lighter';

    if (i.activo && !i.resuelto) {
      var f = i.lleno;
      /* El anillo de afuera: donde hay que apoyar. Late despacio mientras
         espera y se queda quieto en cuanto alguien apoya — dejar de latir es
         lo que dice "sí, así". */
      var pulso = i.sosteniendo ? 1 : (.5 + .5 * Math.sin(t * 2.6));
      cx.strokeStyle = 'rgba(' + TINTA.espera + ',' + (.20 + .22 * pulso).toFixed(3) + ')';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.arc(i.x, i.y, i.radio, 0, 6.2832);
      cx.stroke();

      /* Y el arco que se llena: cuánto se lleva mirando. Empieza arriba y va
         para la derecha, como cualquier cosa que se llena. */
      if (f > 0) {
        cx.strokeStyle = 'rgba(' + TINTA.lleno + ',' + (.55 + .45 * f).toFixed(3) + ')';
        cx.lineWidth = 3 + 4 * f;
        cx.lineCap = 'round';
        cx.beginPath();
        cx.arc(i.x, i.y, i.radio, -Math.PI / 2, -Math.PI / 2 + f * 6.2832);
        cx.stroke();
        cx.lineCap = 'butt';
      }

      // Cerca del final se enciende: se siente que está por pasar algo.
      if (f > .5) {
        var g = cx.createRadialGradient(i.x, i.y, i.radio * .4, i.x, i.y, i.radio * 1.6);
        g.addColorStop(0, 'rgba(' + TINTA.cerca + ',0)');
        g.addColorStop(.7, 'rgba(' + TINTA.cerca + ',' + (.20 * (f - .5) * 2).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + TINTA.cerca + ',0)');
        cx.fillStyle = g;
        cx.beginPath(); cx.arc(i.x, i.y, i.radio * 1.6, 0, 6.2832); cx.fill();
      }
    }

    // Lo vio: un anillo que se abre y se apaga.
    if (i.destello > 0) {
      var q = i.destello;
      var rr = i.radio * (1 + (1 - q) * 1.5);
      cx.strokeStyle = 'rgba(' + TINTA.vio + ',' + (q * q * .85).toFixed(3) + ')';
      cx.lineWidth = 2 + 7 * q;
      cx.beginPath(); cx.arc(i.x, i.y, rr, 0, 6.2832); cx.stroke();
      var g2 = cx.createRadialGradient(i.x, i.y, 0, i.x, i.y, i.radio * 2.2);
      g2.addColorStop(0, 'rgba(' + TINTA.vio + ',' + (.30 * q).toFixed(3) + ')');
      g2.addColorStop(1, 'rgba(' + TINTA.vio + ',0)');
      cx.fillStyle = g2;
      cx.beginPath(); cx.arc(i.x, i.y, i.radio * 2.2, 0, 6.2832); cx.fill();
    }
    cx.restore();
  }
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Instante; }
