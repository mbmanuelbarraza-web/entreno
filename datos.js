// Catálogo de ejercicios y rutina de Emiliano.
// GIFs e instrucciones: dataset hasaneyldrm/exercises-dataset. Imágenes © Gym visual — https://gymvisual.com/
// Para cambiar la rutina o agregar ejercicios, se edita este archivo.

const GIF_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const ATRIBUCION = "© Gym visual — gymvisual.com";

// Reglas (se pueden cambiar sin tocar el resto de la app)
const REGLAS = {
  // Descansos: Emiliano indica 40" a 1'. En los pesados dejamos 1:30 porque rinden mejor con un poco más de pausa.
  compuesto:   { series: 4, repsMin: 6,  repsMax: 10, descanso: 90 },
  aislamiento: { series: 3, repsMin: 10, repsMax: 15, descanso: 60 },
  pasoPeso: 1,          // kg que suben/bajan los botones + y − (se cambia por ejercicio)
  avisoPrevio: 10,      // segundos antes del fin del descanso

  // ---- Control de tiempo ----
  limiteMin: 75,        // duración máxima del entrenamiento (1 h 15)
  // Ritmo inicial medido en los entrenamientos del 3 y 5/10 (segundos). Después la app usa tu ritmo real.
  ritmoInicial: { compuesto: 47, aislamiento: 63, cambio: 112, calentamiento: 600 },
  minSeries: { aislamiento: 2, compuesto: 3 },   // si hay que recortar, nunca menos que esto
  recuperacion: { principalH: 48, secundarioH: 24 }, // horas de descanso por músculo
  pendientesDias: 8,    // un pendiente se descarta si pasan más de estos días
};

const NOMBRES_MUSCULOS = { pecho:"Pecho", espalda:"Espalda", biceps:"Bíceps", triceps:"Tríceps", hombros:"Hombros",
  cuadriceps:"Cuádriceps", isquios:"Isquiotibiales", gluteos:"Glúteos", gemelos:"Gemelos", abdominales:"Abdominales",
  lumbares:"Lumbares", antebrazos:"Antebrazos", trapecios:"Trapecios" };

const EJERCICIOS = {
 "banco_plano": {
  "nombre": "Banco plano",
  "tipo": "compuesto",
  "principal": "pecho",
  "secundarios": [
   "triceps",
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "Con barra o mancuernas",
  "gif": "videos/0025-EIeI8Vf.gif",
  "pasos": [
   "Túmbate sobre un banco con los pies apoyados en el suelo y la espalda presionada contra el banco.",
   "Agarra la barra con un agarre pronado un poco más ancho que la separación de los hombros.",
   "Levanta la barra del soporte y sostenla directamente sobre el pecho con los brazos completamente extendidos.",
   "Baja la barra lentamente hacia el pecho, manteniendo los codos pegados al cuerpo.",
   "Haz una pausa breve cuando la barra toque el pecho.",
   "Empuja la barra de vuelta a la posición inicial extendiendo los brazos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "barbell bench press"
 },
 "banco_inclinado": {
  "nombre": "Banco inclinado",
  "tipo": "compuesto",
  "principal": "pecho",
  "secundarios": [
   "hombros",
   "triceps"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0047-3TZduzM.gif",
  "pasos": [
   "Coloca un banco inclinado a un ángulo de 45 grados.",
   "Túmbate en el banco con los pies planos sobre el suelo.",
   "Agarra la barra con un agarre pronado un poco más ancho que la separación de los hombros.",
   "Saca la barra del soporte y bájala lentamente hacia el pecho, manteniendo los codos a un ángulo de 45 grados.",
   "Haz una pausa breve en la parte baja y luego empuja la barra de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "barbell incline bench press"
 },
 "aperturas_planas": {
  "nombre": "Aperturas planas con mancuernas",
  "tipo": "aislamiento",
  "principal": "pecho",
  "secundarios": [
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0308-yz9nUhF.gif",
  "pasos": [
   "Túmbate boca arriba en un banco con una mancuerna en cada mano, con las palmas enfrentadas entre sí.",
   "Extiende los brazos rectos hacia arriba sobre el pecho, con una ligera flexión en los codos.",
   "Manteniendo una ligera flexión en los codos, baja los brazos hacia los lados en un amplio arco hasta sentir un estiramiento en el pecho.",
   "Haz una pausa por un momento, luego invierte el movimiento y lleva las mancuernas de nuevo hacia arriba hasta la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell fly"
 },
 "aperturas_inclinadas": {
  "nombre": "Aperturas inclinadas con mancuernas",
  "tipo": "aislamiento",
  "principal": "pecho",
  "secundarios": [
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0319-ESOd5Pl.gif",
  "pasos": [
   "Ajusta un banco inclinado a un ángulo de 45 grados.",
   "Siéntate en el banco con una mancuerna en cada mano, con las palmas enfrentadas entre sí.",
   "Recuéstate en el banco y empuja las mancuernas hacia arriba hasta la posición inicial, directamente por encima del pecho.",
   "Baja las mancuernas hacia los lados describiendo un amplio arco hasta sentir un estiramiento en el pecho.",
   "Haz una pausa por un momento, luego contrae los músculos del pecho para llevar las mancuernas de nuevo hacia arriba hasta la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell incline fly"
 },
 "biceps_barra_w": {
  "nombre": "Bíceps con barra W",
  "tipo": "aislamiento",
  "principal": "biceps",
  "secundarios": [
   "antebrazos"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0447-6TG6x2w.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sostén la barra EZ con agarre supino, palmas hacia arriba.",
   "Mantén los codos cerca del torso y los brazos superiores quietos durante todo el movimiento.",
   "Exhala mientras subes la barra hacia los hombros, contrayendo los bíceps.",
   "Haz una pausa breve en la parte más alta, luego inhala mientras bajas lentamente la barra de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "ez barbell curl"
 },
 "biceps_mancuernas": {
  "nombre": "Bíceps con mancuernas",
  "tipo": "aislamiento",
  "principal": "biceps",
  "secundarios": [
   "antebrazos"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0294-NbVPDMW.gif",
  "pasos": [
   "Ponte de pie con una mancuerna en cada mano, con las palmas hacia adelante y los brazos completamente extendidos.",
   "Manteniendo los brazos superiores fijos, exhala y levanta el peso mientras contraes los bíceps.",
   "Continúa levantando las pesas hasta que los bíceps estén completamente contraídos y las mancuernas estén a la altura de los hombros.",
   "Mantén la posición contraída durante una breve pausa mientras aprietas los bíceps.",
   "Inhala y comienza a bajar lentamente las mancuernas de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell biceps curl"
 },
 "biceps_maquina": {
  "nombre": "Bíceps en máquina",
  "tipo": "aislamiento",
  "principal": "biceps",
  "secundarios": [
   "antebrazos"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0575-q6y3OhV.gif",
  "pasos": [
   "Ajusta la altura del asiento y colócate en la máquina con la espalda apoyada en la almohadilla.",
   "Sujeta las asas con un agarre supino, con las palmas hacia arriba, y mantén los codos cerca de los costados.",
   "Exhala y flexiona las asas hacia arriba, contrayendo los bíceps.",
   "Haz una pausa breve en la parte más alta del movimiento, contrayendo los bíceps.",
   "Inhala y baja lentamente los mangos de vuelta a la posición inicial, extendiendo completamente los brazos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "lever bicep curl"
 },
 "biceps_concentrado": {
  "nombre": "Bíceps concentrado",
  "tipo": "aislamiento",
  "principal": "biceps",
  "secundarios": [
   "antebrazos"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0297-gvsWLQw.gif",
  "pasos": [
   "Siéntate en un banco con las piernas separadas y una mancuerna en una mano, apoyando el codo en la parte interna del muslo.",
   "Extiende completamente el brazo y sujeta la mancuerna con un agarre supino.",
   "Manteniendo el brazo superior quieto, exhala y flexiona el peso hacia el hombro mientras contraes el bíceps.",
   "Continúa levantando la mancuerna hasta que el bíceps esté completamente contraído y la mancuerna esté a la altura del hombro.",
   "Mantén la posición contraída durante una breve pausa mientras aprietas los bíceps.",
   "Inhala y baja lentamente la mancuerna de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado, luego cambia de brazo."
  ],
  "original": "dumbbell concentration curl"
 },
 "dominadas": {
  "nombre": "Dominadas",
  "tipo": "compuesto",
  "principal": "espalda",
  "secundarios": [
   "biceps",
   "antebrazos"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0652-lBDjFxJ.gif",
  "pasos": [
   "Cuélgate de una barra de dominadas con las palmas hacia afuera y los brazos completamente extendidos.",
   "Activa el core y junta los omóplatos.",
   "Tira de tu cuerpo hacia la barra flexionando los codos y llevando el pecho hacia la barra.",
   "Haz una pausa en la parte alta del movimiento y luego baja lentamente el cuerpo de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "pull-up"
 },
 "remo_maquina": {
  "nombre": "Remo en máquina",
  "tipo": "compuesto",
  "principal": "espalda",
  "secundarios": [
   "biceps",
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/1350-7I6LNUG.gif",
  "pasos": [
   "Ajusta la altura del asiento y los apoyapiés a una posición cómoda.",
   "Siéntate en la máquina con el pecho apoyado en la almohadilla y los pies sobre los apoyapiés.",
   "Agarra las asas con un agarre prono, con las manos separadas a la altura de los hombros.",
   "Mantén la espalda recta y el core activado.",
   "Jala las agarraderas hacia el cuerpo, apretando los omóplatos entre sí.",
   "Haz una pausa breve en la parte alta del movimiento.",
   "Suelta lentamente las asas y vuelve a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "lever seated row"
 },
 "dorsalera_cerrado": {
  "nombre": "Dorsalera agarre cerrado",
  "tipo": "compuesto",
  "principal": "espalda",
  "secundarios": [
   "biceps"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/2616-4c9BhzB.gif",
  "pasos": [
   "Siéntate en la máquina de jalón de cable y agarra el accesorio en V con un agarre prono.",
   "Ajusta la almohadilla de rodillas para que tus muslos queden asegurados debajo de ella.",
   "Mantén la espalda recta e inclínate ligeramente hacia atrás.",
   "Jala el accesorio en V hacia la parte superior del pecho manteniendo los codos cerca del cuerpo.",
   "Aprieta los músculos de la espalda en la parte baja del movimiento.",
   "Regresa lentamente el accesorio en V a la posición inicial y repite el número de repeticiones deseado."
  ],
  "original": "cable lateral pulldown with v-bar"
 },
 "dorsalera_abierto": {
  "nombre": "Dorsalera agarre abierto",
  "tipo": "compuesto",
  "principal": "espalda",
  "secundarios": [
   "biceps",
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0150-eYnzaCm.gif",
  "pasos": [
   "Ajusta la polea del cable a una posición alta y coloca una barra recta.",
   "Siéntate frente a la máquina de cable con los pies planos en el suelo y las rodillas ligeramente flexionadas.",
   "Sujeta la barra con agarre prono, un poco más separado que el ancho de los hombros.",
   "Inclínate ligeramente hacia atrás y mantén el pecho elevado, conservando un ligero arco en la zona lumbar.",
   "Tira de la barra hacia el pecho, guiando el movimiento con los codos y juntando los omóplatos.",
   "Haz una pausa breve en la parte más baja del movimiento, luego vuelve lentamente la barra a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "cable bar lateral pulldown"
 },
 "fondos": {
  "nombre": "Tríceps en fondos entre paralelas",
  "tipo": "compuesto",
  "principal": "triceps",
  "secundarios": [
   "pecho",
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0814-X6C6i5Y.gif",
  "pasos": [
   "Siéntate en el borde de un banco o silla con las manos sujetando el borde, los dedos apuntando hacia adelante.",
   "Desliza los glúteos fuera del banco, sosteniendo tu peso con las manos.",
   "Flexiona los codos y baja el cuerpo hacia el suelo, manteniendo la espalda cerca del banco.",
   "Haz una pausa por un momento en la parte inferior, luego empuja tu cuerpo de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "triceps dip"
 },
 "triceps_maquina": {
  "nombre": "Tríceps en máquina",
  "tipo": "aislamiento",
  "principal": "triceps",
  "secundarios": [],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0607-Ser9eQp.gif",
  "pasos": [
   "Ajusta la altura del asiento y colócate en la máquina con la espalda apoyada en la almohadilla.",
   "Agarra las asas con un agarre prono y extiende completamente los brazos frente a ti.",
   "Manteniendo la parte superior de los brazos inmóvil, baja lentamente las asas hacia tu frente flexionando los codos.",
   "Haz una pausa por un momento en la parte baja y luego empuja las asas de vuelta hacia arriba hasta la posición inicial extendiendo los brazos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "lever triceps extension"
 },
 "triceps_tras_nuca": {
  "nombre": "Tríceps con mancuerna tras nuca",
  "tipo": "aislamiento",
  "principal": "triceps",
  "secundarios": [
   "hombros"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/2188-kont8Ut.gif",
  "pasos": [
   "Siéntate en un banco con la espalda recta y los pies planos sobre el suelo.",
   "Sujeta una mancuerna con ambas manos y extiende los brazos rectos por encima de la cabeza.",
   "Flexiona los codos y baja la mancuerna detrás de la cabeza, manteniendo la parte superior de los brazos cerca de las orejas.",
   "Haz una pausa por un momento, luego endereza los brazos y vuelve a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell seated triceps extension"
 },
 "triceps_polea": {
  "nombre": "Tríceps con polea",
  "tipo": "aislamiento",
  "principal": "triceps",
  "secundarios": [],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0201-3ZflifB.gif",
  "pasos": [
   "Sujeta una barra recta a una máquina de cable con polea alta.",
   "Ponte de pie frente a la máquina con los pies separados a la altura de los hombros y una ligera flexión en las rodillas.",
   "Sujeta la barra con un agarre prono, con las manos separadas a la altura de los hombros.",
   "Mantén los codos cerca de los costados y los brazos superiores quietos.",
   "Exhala y empuja la barra hacia abajo hasta que los codos queden completamente extendidos.",
   "Haz una pausa por un momento, luego inhala y regresa lentamente la barra a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "cable pushdown"
 },
 "sentadillas": {
  "nombre": "Sentadillas",
  "tipo": "compuesto",
  "principal": "cuadriceps",
  "secundarios": [
   "gluteos",
   "isquios",
   "lumbares"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0043-qXTaZnJ.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros, con los dedos de los pies ligeramente hacia afuera.",
   "Sujeta la barra sobre la parte superior de la espalda, apoyándola en los trapecios o los deltoides posteriores.",
   "Activa el core y mantén el pecho elevado mientras comienzas a bajar el cuerpo.",
   "Flexiona las rodillas y las caderas, empujando las caderas hacia atrás y hacia abajo como si te sentaras en una silla.",
   "Baja hasta que los muslos queden paralelos al suelo o un poco por debajo.",
   "Mantén las rodillas alineadas con los dedos de los pies y el peso sobre los talones.",
   "Empuja con los talones para volver a ponerte de pie, extendiendo las caderas y las rodillas.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "barbell full squat"
 },
 "estocadas": {
  "nombre": "Estocadas",
  "tipo": "compuesto",
  "principal": "cuadriceps",
  "secundarios": [
   "gluteos",
   "isquios"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0336-RRWFUcw.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros, sujetando una mancuerna en cada mano.",
   "Da un paso adelante con el pie derecho, bajando el cuerpo hasta una posición de zancada.",
   "Mantén la espalda recta y el pecho erguido mientras bajas el cuerpo.",
   "Empuja con el talón derecho para regresar a la posición inicial.",
   "Repite con la pierna izquierda.",
   "Alterna las piernas el número de repeticiones deseado."
  ],
  "original": "dumbbell lunge"
 },
 "camilla_isquios": {
  "nombre": "Camilla de isquiotibiales",
  "tipo": "aislamiento",
  "principal": "isquios",
  "secundarios": [
   "gemelos"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0586-17lJ1kr.gif",
  "pasos": [
   "Ajusta la máquina a tu cuerpo y selecciona el peso deseado.",
   "Túmbate boca abajo en la máquina con las piernas rectas y los talones contra la palanca acolchada.",
   "Sujeta las asas o los lados de la máquina para mayor estabilidad.",
   "Manteniendo la parte superior del cuerpo inmóvil, exhala y flexiona las piernas hacia arriba tanto como sea posible sin levantar las caderas de la almohadilla.",
   "Mantén la posición contraída durante una pausa breve mientras aprietas los isquiotibiales.",
   "Inhala y baja lentamente la palanca de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "lever lying leg curl"
 },
 "gemelos_prensa": {
  "nombre": "Gemelos en prensa",
  "tipo": "aislamiento",
  "principal": "gemelos",
  "secundarios": [],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/1391-ykHcWme.gif",
  "pasos": [
   "Ajusta el asiento de la máquina de prensa de piernas de modo que las rodillas queden ligeramente flexionadas cuando los pies estén sobre el trineo.",
   "Coloca los pies separados a la altura de los hombros sobre el trineo, con los dedos de los pies apuntando hacia delante.",
   "Suelta las asas de seguridad y empuja el trineo alejándolo de ti extendiendo las rodillas y los tobillos.",
   "Haz una pausa por un momento en la parte alta del movimiento, luego baja lentamente el trineo doblando las rodillas y los tobillos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "sled calf press on leg press"
 },
 "press_hombros_maquina": {
  "nombre": "Press de hombros en máquina",
  "tipo": "compuesto",
  "principal": "hombros",
  "secundarios": [
   "triceps"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0603-67n3r98.gif",
  "pasos": [
   "Ajusta la altura del asiento y colócate en la máquina con la espalda apoyada en el respaldo.",
   "Agarra las asas con un agarre prono y coloca las manos a la altura de los hombros.",
   "Empuja las asas hacia arriba hasta que los brazos queden completamente extendidos, pero sin bloquear los codos.",
   "Haz una pausa breve en lo alto, luego baja lentamente las asas de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "lever shoulder press"
 },
 "remo_menton": {
  "nombre": "Remo al mentón",
  "tipo": "aislamiento",
  "principal": "hombros",
  "secundarios": [
   "trapecios",
   "biceps"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0120-UDlhcO8.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sujeta una barra con agarre prono, manos un poco más separadas que el ancho de los hombros.",
   "Deja que la barra cuelgue frente a los muslos, con los brazos completamente extendidos.",
   "Manteniendo la espalda recta y el core activado, exhala y levanta la barra en línea recta hacia la barbilla, guiando el movimiento con los codos.",
   "Haz una pausa breve en la parte más alta, luego inhala y baja lentamente la barra de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "barbell upright row"
 },
 "press_arnold": {
  "nombre": "Press Arnold",
  "tipo": "compuesto",
  "principal": "hombros",
  "secundarios": [
   "triceps"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/2137-Xy4jlWA.gif",
  "pasos": [
   "Siéntate en un banco con respaldo y sujeta una mancuerna en cada mano a la altura del hombro, con las palmas hacia tu cuerpo y los codos flexionados.",
   "Empuja las mancuernas hacia arriba hasta que los brazos estén completamente extendidos y las palmas miren hacia adelante.",
   "Rota las muñecas mientras levantas, de modo que las palmas miren hacia adelante en la parte alta del movimiento.",
   "Haz una pausa breve en la parte alta, luego baja lentamente las mancuernas de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell arnold press"
 },
 "vuelos": {
  "nombre": "Vuelos combinados (laterales, frontales y posteriores)",
  "tipo": "aislamiento",
  "principal": "hombros",
  "secundarios": [
   "trapecios"
  ],
  "pesoCorporal": false,
  "nota": "Laterales, frontales y posteriores",
  "gif": "videos/0334-DsgkuIt.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sostén una mancuerna en cada mano, con las palmas hacia el cuerpo.",
   "Mantén la espalda recta y activa el core.",
   "Levanta los brazos hacia los lados hasta que queden paralelos al suelo, manteniendo una ligera flexión en los codos.",
   "Haz una pausa por un momento en la parte superior, luego baja lentamente los brazos de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell lateral raise"
 },
 "abdominales": {
  "nombre": "Abdominales",
  "tipo": "bloque",
  "principal": "abdominales",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0274-TFqbd8t.gif",
  "pasos": [
   "Túmbate sobre tu espalda con las rodillas flexionadas y los pies apoyados en el suelo.",
   "Coloca las manos detrás de la cabeza con los codos apuntando hacia afuera.",
   "Activa el abdomen y levanta los hombros del suelo, flexionándote hacia adelante en dirección a las rodillas.",
   "Haz una pausa breve en la parte alta, luego baja lentamente los hombros de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "crunch floor"
 },
 "espinales": {
  "nombre": "Espinales",
  "tipo": "bloque",
  "principal": "lumbares",
  "secundarios": [
   "gluteos",
   "isquios"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0489-zhMwOwE.gif",
  "pasos": [
   "Ajusta el banco de hiperextensiones para que la parte superior de los muslos quede apoyada en la almohadilla y los pies queden asegurados.",
   "Cruza los brazos sobre el pecho o coloca las manos detrás de la cabeza.",
   "Baja la parte superior del cuerpo hacia el suelo manteniendo la espalda recta.",
   "Haz una pausa breve en la parte baja, luego eleva la parte superior del cuerpo hasta que quede alineada con las piernas.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "hyperextension"
 }
};

const DIAS = {
 "1": {
  "nombre": "Pecho y bíceps",
  "ejercicios": [
   "banco_plano",
   "banco_inclinado",
   "aperturas_planas",
   "aperturas_inclinadas",
   "biceps_barra_w",
   "biceps_mancuernas",
   "biceps_maquina",
   "biceps_concentrado"
  ]
 },
 "2": {
  "nombre": "Espalda y tríceps",
  "ejercicios": [
   "dominadas",
   "remo_maquina",
   "dorsalera_cerrado",
   "dorsalera_abierto",
   "fondos",
   "triceps_maquina",
   "triceps_tras_nuca",
   "triceps_polea"
  ]
 },
 "3": {
  "nombre": "Piernas y hombros",
  "ejercicios": [
   "sentadillas",
   "estocadas",
   "camilla_isquios",
   "gemelos_prensa",
   "press_hombros_maquina",
   "remo_menton",
   "press_arnold",
   "vuelos"
  ]
 }
};


// ---------- Entrada en calor (unos 8 minutos, según los músculos del día) ----------
// Estructura: activación general (bici) + movilidad específica + series de aproximación.
// Todos tienen botón "Iniciar" con cuenta regresiva (seg = tiempo estimado); al terminar se marcan solos como hechos.
Object.assign(EJERCICIOS, {
 "bici": {
  "nombre": "Bici fija",
  "tipo": "calentamiento",
  "principal": "cuadriceps",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/2138-H1PESYI.gif",
  "pasos": [
   "Ajusta la altura y la posición del asiento para asegurar una alineación correcta.",
   "Coloca los pies sobre los pedales y sujétalos con las correas si están disponibles.",
   "Comienza a pedalear a un ritmo cómodo.",
   "Mantén un ritmo constante y aumenta la resistencia según lo desees.",
   "Activa los músculos del core para mantener la estabilidad y una postura correcta.",
   "Continúa pedaleando durante la duración deseada de tu entrenamiento.",
   "Disminuye gradualmente la resistencia y reduce la velocidad antes de detenerte por completo.",
   "Estira las piernas y enfría después del entrenamiento."
  ],
  "original": "stationary bike run v. 3"
 },
 "estir_pecho_dinamico": {
  "nombre": "Estiramiento dinámico de pecho",
  "tipo": "calentamiento",
  "principal": "pecho",
  "secundarios": [
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1167-3uj0Ozg.gif",
  "pasos": [
   "Ponte de pie con la espalda recta y los pies separados a la altura de los hombros.",
   "Extiende los brazos hacia los lados, paralelos al suelo.",
   "Lleva lentamente los brazos hacia adelante, cruzándolos frente al cuerpo.",
   "Siente el estiramiento en los músculos del pecho.",
   "Mantén el estiramiento durante 10-30 segundos.",
   "Vuelve a la posición inicial y repite el número de repeticiones deseado."
  ],
  "original": "dynamic chest stretch (male)"
 },
 "flexiones_inclinadas": {
  "nombre": "Flexiones de brazos inclinadas",
  "tipo": "calentamiento",
  "principal": "pecho",
  "secundarios": [
   "triceps",
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0493-B1EVP9F.gif",
  "pasos": [
   "Coloca las manos sobre una superficie elevada, como un banco o un escalón, ligeramente más separadas que la altura de los hombros.",
   "Extiende las piernas detrás de ti, apoyándote en la punta de los pies, formando una línea recta desde la cabeza hasta los talones.",
   "Baja el pecho hacia la superficie elevada doblando los codos, manteniendo el cuerpo en línea recta.",
   "Haz una pausa breve en la parte baja, luego empújate de nuevo hacia arriba a la posición inicial estirando los brazos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "incline push-up"
 },
 "flexiones_escapulares": {
  "nombre": "Flexiones escapulares",
  "tipo": "calentamiento",
  "principal": "hombros",
  "secundarios": [
   "pecho"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/3021-jV65tKx.gif",
  "pasos": [
   "Comienza en una posición de plancha alta con las manos justo debajo de los hombros y el cuerpo en línea recta.",
   "Baja el pecho hacia el suelo, manteniendo los codos cerca del cuerpo.",
   "A medida que bajas, junta las escápulas y empuja el pecho hacia delante.",
   "Haz una pausa por un momento en la posición baja, luego empuja de nuevo hacia arriba hasta la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "scapula push-up"
 },
 "rotacion_externa": {
  "nombre": "Rotación externa de hombro en polea",
  "tipo": "calentamiento",
  "principal": "hombros",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0235-FWdVhcW.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y las rodillas ligeramente flexionadas.",
   "Sujeta el mango del cable con el brazo extendido frente a ti, paralelo al suelo.",
   "Mantén el codo ligeramente flexionado y los omóplatos retraídos hacia atrás.",
   "Rota lentamente el brazo hacia afuera, alejándolo de tu cuerpo, manteniendo el codo en la misma posición.",
   "Haz una pausa por un momento al final del movimiento, luego regresa lentamente a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "cable standing shoulder external rotation"
 },
 "dominadas_escapulares": {
  "nombre": "Dominadas escapulares",
  "tipo": "calentamiento",
  "principal": "espalda",
  "secundarios": [
   "trapecios"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0688-uTBt1HV.gif",
  "pasos": [
   "Comienza colgándote de una barra de dominadas con las palmas hacia afuera y los brazos completamente extendidos.",
   "Retrae las escápulas llevándolas hacia abajo y atrás.",
   "Activa los músculos de la espalda y tira de tu cuerpo hacia la barra, enfocándote en juntar las escápulas.",
   "Haz una pausa breve en la parte superior del movimiento, luego baja lentamente el cuerpo de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "scapular pull-up"
 },
 "vuelos_posteriores_livianos": {
  "nombre": "Vuelos posteriores livianos",
  "tipo": "calentamiento",
  "principal": "hombros",
  "secundarios": [
   "espalda"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0383-EAs3xL9.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sostén una mancuerna en cada mano.",
   "Flexiona ligeramente las rodillas e inclínate hacia adelante desde las caderas, manteniendo la espalda recta.",
   "Extiende los brazos rectos hacia adelante, con las palmas mirándose entre sí.",
   "Manteniendo una ligera flexión en los codos, levanta los brazos hacia los lados hasta que queden paralelos al suelo.",
   "Haz una pausa por un momento en la parte superior, luego baja lentamente los brazos de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell reverse fly"
 },
 "estir_dorsal": {
  "nombre": "Estiramiento de dorsal arrodillado",
  "tipo": "calentamiento",
  "principal": "espalda",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1346-f38OEuO.gif",
  "pasos": [
   "Arrodíllate en el suelo con las rodillas separadas a la altura de las caderas y los dedos de los pies apuntando hacia atrás.",
   "Extiende los brazos por encima de la cabeza y entrelaza los dedos.",
   "Manteniendo la espalda recta, inclínate lentamente hacia el lado derecho, sintiendo un estiramiento en el dorsal izquierdo.",
   "Mantén el estiramiento durante 20-30 segundos, luego vuelve a la posición inicial.",
   "Repite el estiramiento en el lado izquierdo, inclinándote hacia la izquierda y sintiendo un estiramiento en el dorsal derecho.",
   "Continúa alternando lados durante el número de repeticiones deseado."
  ],
  "original": "kneeling lat stretch"
 },
 "estir_triceps": {
  "nombre": "Estiramiento de tríceps",
  "tipo": "calentamiento",
  "principal": "triceps",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0817-uOV3Itw.gif",
  "pasos": [
   "Ponte de pie o siéntate erguido con la espalda recta.",
   "Extiende un brazo por encima de la cabeza, flexionándolo por el codo.",
   "Coloca la mano opuesta sobre el codo flexionado y tira de él suavemente hacia tu cabeza.",
   "Mantén el estiramiento de 15 a 30 segundos, sintiendo un estiramiento suave en el tríceps.",
   "Suelta el estiramiento y repite con el otro brazo."
  ],
  "original": "triceps stretch"
 },
 "sentadilla_brazos_arriba": {
  "nombre": "Sentadilla con brazos arriba",
  "tipo": "calentamiento",
  "principal": "cuadriceps",
  "secundarios": [
   "gluteos",
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1685-QChZi3x.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y los dedos de los pies ligeramente hacia afuera.",
   "Baja el cuerpo hacia una posición de sentadilla flexionando las rodillas y empujando las caderas hacia atrás.",
   "Mientras te levantas de la sentadilla, extiende los brazos por encima de la cabeza, alcanzando hacia el techo.",
   "Vuelve a la posición inicial bajando los brazos y flexionando las rodillas para volver a hacer la sentadilla.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "squat to overhead reach"
 },
 "gran_estiramiento": {
  "nombre": "Estiramiento completo de cadera (world's greatest stretch)",
  "tipo": "calentamiento",
  "principal": "isquios",
  "secundarios": [
   "gluteos",
   "cuadriceps"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1604-DFGXwZr.gif",
  "pasos": [
   "Comienza en posición de zancada con el pie derecho adelante y el pie izquierdo atrás.",
   "Coloca las manos en el suelo a ambos lados de tu pie derecho.",
   "Baja la rodilla izquierda hacia el suelo y extiende la pierna derecha, manteniendo el pie derecho plano sobre el suelo.",
   "Gira el torso hacia la derecha, extendiendo el brazo derecho hacia el techo.",
   "Mantén esta posición durante unos segundos, luego vuelve a la posición inicial.",
   "Cambia de lado y repite el estiramiento con el pie izquierdo adelante."
  ],
  "original": "world greatest stretch"
 },
 "puente_gluteos": {
  "nombre": "Puente de glúteos",
  "tipo": "calentamiento",
  "principal": "gluteos",
  "secundarios": [
   "isquios"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/3013-u0cNiij.gif",
  "pasos": [
   "Túmbate sobre tu espalda con las rodillas flexionadas y los pies apoyados en el suelo.",
   "Coloca los brazos a los lados del cuerpo, con las palmas hacia abajo.",
   "Activa los glúteos y el core, y luego eleva las caderas del suelo hasta que tu cuerpo forme una línea recta desde las rodillas hasta los hombros.",
   "Haz una pausa breve en la parte alta, apretando los glúteos.",
   "Baja lentamente las caderas de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "low glute bridge on floor"
 },
 "circulos_tobillo": {
  "nombre": "Círculos de tobillo",
  "tipo": "calentamiento",
  "principal": "gemelos",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1368-uL9CsKm.gif",
  "pasos": [
   "Siéntate en el suelo con las piernas extendidas frente a ti.",
   "Levanta una pierna del suelo y rota el tobillo con un movimiento circular.",
   "Realiza el número de círculos deseado en una dirección, luego cambia a la dirección contraria.",
   "Repite con la otra pierna."
  ],
  "original": "ankle circles"
 }
});

const CALENTAMIENTO = {
 "1": [
  {
   "e": "bici",
   "dosis": "3 min, ritmo suave",
   "seg": 180,
   "temporizador": true
  },
  {
   "e": "estir_pecho_dinamico",
   "dosis": "30 segundos, abriendo y cerrando los brazos",
   "seg": 30,
   "temporizador": true
  },
  {
   "e": "flexiones_inclinadas",
   "dosis": "10 repeticiones, apoyando las manos en un banco",
   "seg": 40,
   "temporizador": false
  },
  {
   "e": "flexiones_escapulares",
   "dosis": "10 repeticiones",
   "seg": 30,
   "temporizador": false
  },
  {
   "e": "rotacion_externa",
   "dosis": "12 por brazo, muy liviano",
   "seg": 60,
   "temporizador": false
  },
  {
   "e": "banco_plano",
   "dosis": "Aproximación: barra sola × 12, después un 50% del peso de trabajo × 8",
   "seg": 120,
   "temporizador": false
  }
 ],
 "2": [
  {
   "e": "bici",
   "dosis": "3 min, ritmo suave",
   "seg": 180,
   "temporizador": true
  },
  {
   "e": "dominadas_escapulares",
   "dosis": "8 repeticiones, colgado de la barra",
   "seg": 30,
   "temporizador": false
  },
  {
   "e": "vuelos_posteriores_livianos",
   "dosis": "12 repeticiones con mancuernas de 3 kg",
   "seg": 40,
   "temporizador": false
  },
  {
   "e": "estir_dorsal",
   "dosis": "20 segundos por lado",
   "seg": 40,
   "temporizador": true
  },
  {
   "e": "estir_triceps",
   "dosis": "20 segundos por brazo",
   "seg": 40,
   "temporizador": true
  },
  {
   "e": "dorsalera_abierto",
   "dosis": "Aproximación: 2 series livianas de 12 y 8 (prepara para las dominadas)",
   "seg": 120,
   "temporizador": false
  }
 ],
 "3": [
  {
   "e": "bici",
   "dosis": "3 min, ritmo suave",
   "seg": 180,
   "temporizador": true
  },
  {
   "e": "sentadilla_brazos_arriba",
   "dosis": "10 repeticiones, lento",
   "seg": 40,
   "temporizador": false
  },
  {
   "e": "gran_estiramiento",
   "dosis": "3 por lado",
   "seg": 60,
   "temporizador": false
  },
  {
   "e": "puente_gluteos",
   "dosis": "12 repeticiones",
   "seg": 40,
   "temporizador": false
  },
  {
   "e": "circulos_tobillo",
   "dosis": "10 por lado",
   "seg": 30,
   "temporizador": false
  },
  {
   "e": "sentadillas",
   "dosis": "Aproximación: barra sola × 10, después un 50% del peso de trabajo × 6",
   "seg": 120,
   "temporizador": false
  }
 ]
};

// ---------- Equipo de cada ejercicio (define cómo se anota el peso) ----------
// barra       = solo los discos, sin contar la barra (decidido por Manuel)
// mancuernas2 = se anota el número de UNA mancuerna (se usan dos; la app muestra "c/u")
// mancuerna1  = se usa una sola mancuerna
// maquina     = la app pregunta una vez si la máquina marca kilos o libras, y se carga el número que se ve
// corporal    = peso del cuerpo; se anota solo el peso extra (0 si no agregás)
const EQUIPO = {
  banco_plano: "barra", banco_inclinado: "barra", aperturas_planas: "mancuernas2", aperturas_inclinadas: "mancuernas2",
  biceps_barra_w: "barra", biceps_mancuernas: "mancuernas2", biceps_maquina: "maquina", biceps_concentrado: "mancuerna1",
  dominadas: "corporal", remo_maquina: "maquina", dorsalera_cerrado: "maquina", dorsalera_abierto: "maquina",
  fondos: "corporal", triceps_maquina: "maquina", triceps_tras_nuca: "mancuerna1", triceps_polea: "maquina",
  sentadillas: "barra", estocadas: "mancuernas2", camilla_isquios: "maquina", gemelos_prensa: "maquina",
  press_hombros_maquina: "maquina", remo_menton: "barra", press_arnold: "mancuernas2", vuelos: "mancuernas2",
};
const PASOS_KG = [0.5, 1, 1.25, 2, 2.5, 5, 10];
const PASOS_LB = [2.5, 5, 10, 15, 20];

// ---------- Cambios en la rutina ----------
// 7/10: el gimnasio no tiene máquina de press de hombros → se reemplaza por press militar con barra (sentado),
// que es además el ejercicio que Emiliano pone en ese lugar en la Rutina 2.
EJERCICIOS.press_militar = {
 "nombre": "Press militar con barra (sentado)",
 "tipo": "compuesto",
 "principal": "hombros",
 "secundarios": [
  "triceps",
  "trapecios"
 ],
 "pesoCorporal": false,
 "nota": "Reemplaza al press de hombros en máquina (no está en tu gimnasio)",
 "gif": "videos/0091-kTbSH9h.gif",
 "pasos": [
  "Siéntate en un banco con la espalda recta y los pies planos sobre el suelo.",
  "Sujeta la barra con un agarre pronado, un poco más ancho que la separación de los hombros.",
  "Levanta la barra del soporte y llévala a la altura de los hombros, con los codos flexionados y las palmas hacia delante.",
  "Empuja la barra por encima de la cabeza extendiendo completamente los brazos.",
  "Haz una pausa breve en la parte alta y luego baja lentamente la barra de vuelta a la altura de los hombros.",
  "Repite el número de repeticiones deseado."
 ],
 "original": "barbell seated overhead press"
};
EQUIPO.press_militar = "barra";
DIAS[3].ejercicios = DIAS[3].ejercicios.map((e) => (e === "press_hombros_maquina" ? "press_militar" : e));

// 10/10: Emiliano confirmó que los vuelos van SEPARADOS → 3 ejercicios con su propio GIF.
Object.assign(EJERCICIOS, {
 "vuelos_laterales": {
  "nombre": "Vuelos laterales",
  "tipo": "aislamiento",
  "principal": "hombros",
  "secundarios": [
   "trapecios"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0334-DsgkuIt.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sostén una mancuerna en cada mano, con las palmas hacia el cuerpo.",
   "Mantén la espalda recta y activa el core.",
   "Levanta los brazos hacia los lados hasta que queden paralelos al suelo, manteniendo una ligera flexión en los codos.",
   "Haz una pausa por un momento en la parte superior, luego baja lentamente los brazos de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell lateral raise",
  "series": 3
 },
 "vuelos_frontales": {
  "nombre": "Vuelos frontales",
  "tipo": "aislamiento",
  "principal": "hombros",
  "secundarios": [
   "pecho"
  ],
  "pesoCorporal": false,
  "nota": "Los press ya trabajan mucho esta parte del hombro: por eso lleva menos series",
  "gif": "videos/0310-3eGE2JC.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros, sosteniendo una mancuerna en cada mano con las palmas hacia los muslos.",
   "Manteniendo los brazos rectos, exhala y levanta las mancuernas frente a ti hasta que queden a la altura de los hombros.",
   "Haz una pausa por un momento en la parte superior, luego inhala y baja lentamente las mancuernas de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell front raise",
  "series": 2
 },
 "vuelos_posteriores": {
  "nombre": "Vuelos posteriores",
  "tipo": "aislamiento",
  "principal": "hombros",
  "secundarios": [
   "espalda",
   "trapecios"
  ],
  "pesoCorporal": false,
  "nota": "",
  "gif": "videos/0380-v1qBec9.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y sostén una mancuerna en cada mano, con las palmas hacia el cuerpo.",
   "Flexiona ligeramente las rodillas e inclínate hacia adelante desde las caderas, manteniendo la espalda recta y el core activado.",
   "Levanta los brazos hacia los lados, manteniendo una ligera flexión en los codos, hasta que queden paralelos al suelo.",
   "Haz una pausa por un momento en la parte superior, luego baja lentamente los brazos de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "dumbbell rear lateral raise",
  "series": 3
 },
 "flexiones": {
  "nombre": "Flexiones de brazos",
  "tipo": "compuesto",
  "principal": "pecho",
  "secundarios": [
   "triceps",
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0662-I4hDWkc.gif",
  "pasos": [
   "Comienza en una posición de plancha alta con las manos un poco más separadas que la anchura de los hombros y los pies juntos.",
   "Activa el core y baja el cuerpo hacia el suelo flexionando los codos, manteniendo el cuerpo en línea recta.",
   "Haz una pausa cuando el pecho esté justo por encima del suelo y luego empújate de vuelta a la posición inicial estirando los brazos.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "push-up"
 },
 "remo_invertido": {
  "nombre": "Remo invertido (bajo una mesa o barra baja)",
  "tipo": "compuesto",
  "principal": "espalda",
  "secundarios": [
   "biceps"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0499-bZGHsAZ.gif",
  "pasos": [
   "Coloca una barra a la altura de la cintura o usa un entrenador de suspensión.",
   "Ponte de pie frente a la barra o al entrenador de suspensión, con los pies separados a la altura de los hombros.",
   "Agarra la barra o las asas con agarre prono, ligeramente más ancho que la altura de los hombros.",
   "Inclínate hacia atrás, manteniendo el cuerpo recto y los talones en el suelo.",
   "Tira del pecho hacia la barra o las asas, apretando los omóplatos entre sí.",
   "Haz una pausa breve en la parte más alta, luego baja lentamente de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "inverted row"
 },
 "sentadilla_corporal": {
  "nombre": "Sentadilla con peso corporal",
  "tipo": "compuesto",
  "principal": "cuadriceps",
  "secundarios": [
   "gluteos"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1685-QChZi3x.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros y los dedos de los pies ligeramente hacia afuera.",
   "Baja el cuerpo hacia una posición de sentadilla flexionando las rodillas y empujando las caderas hacia atrás.",
   "Mientras te levantas de la sentadilla, extiende los brazos por encima de la cabeza, alcanzando hacia el techo.",
   "Vuelve a la posición inicial bajando los brazos y flexionando las rodillas para volver a hacer la sentadilla.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "squat to overhead reach"
 },
 "estocadas_caminando": {
  "nombre": "Estocadas caminando",
  "tipo": "compuesto",
  "principal": "cuadriceps",
  "secundarios": [
   "gluteos",
   "isquios"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1460-IZVHb27.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros.",
   "Da un paso adelante con la pierna derecha, bajando el cuerpo a una posición de zancada.",
   "Mantén el torso erguido y la rodilla delantera alineada con el tobillo.",
   "Empújate con el pie derecho y lleva el pie izquierdo hacia adelante, entrando en una posición de zancada con la pierna izquierda.",
   "Continúa alternando las piernas y avanzando, manteniendo un ritmo controlado y constante.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "walking lunge"
 },
 "fondos_banco": {
  "nombre": "Fondos en banco o silla",
  "tipo": "aislamiento",
  "principal": "triceps",
  "secundarios": [
   "hombros"
  ],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/0129-RrLske5.gif",
  "pasos": [
   "Siéntate en el borde de un banco o silla con las manos sujetando el borde junto a las caderas.",
   "Desliza los glúteos fuera del banco y estira las piernas frente a ti, manteniendo los talones en el suelo.",
   "Flexiona los codos y baja el cuerpo hacia el suelo, manteniendo la espalda cerca del banco.",
   "Haz una pausa por un momento en la parte inferior, luego empuja tu cuerpo de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "bench dip (knees bent)"
 },
 "gemelos_parado": {
  "nombre": "Gemelos parado",
  "tipo": "aislamiento",
  "principal": "gemelos",
  "secundarios": [],
  "pesoCorporal": true,
  "nota": "",
  "gif": "videos/1373-bJYHBIN.gif",
  "pasos": [
   "Ponte de pie con los pies separados a la altura de los hombros, con las puntas de los pies apuntando hacia adelante.",
   "Coloca las manos sobre una pared o superficie estable para mantener el equilibrio.",
   "Levanta lentamente los talones del suelo, llevando el peso del cuerpo hacia las puntas de los pies.",
   "Haz una pausa breve en la parte alta y luego baja lentamente los talones de vuelta a la posición inicial.",
   "Repite el número de repeticiones deseado."
  ],
  "original": "bodyweight standing calf raise"
 }
});
Object.assign(EQUIPO, { vuelos_laterales: "mancuernas2", vuelos_frontales: "mancuernas2", vuelos_posteriores: "mancuernas2",
  flexiones: "corporal", remo_invertido: "corporal", sentadilla_corporal: "corporal", estocadas_caminando: "corporal",
  fondos_banco: "corporal", gemelos_parado: "corporal", puente_gluteos: "corporal" });
DIAS[3].ejercicios = DIAS[3].ejercicios.flatMap((e) => (e === "vuelos" ? ["vuelos_laterales", "vuelos_frontales", "vuelos_posteriores"] : [e]));

// ---------- Rutinas especiales (las ofrece la app según lo que te pase) ----------
// Mantenimiento: 2 días por semana, cuerpo completo, ~45 min. Alcanza para no perder lo ganado
// mientras tenés menos tiempo. "series" fija cuántas series lleva cada ejercicio en esa rutina.
DIAS.MA = { nombre: "Mantenimiento A · cuerpo completo", especial: "mantenimiento",
  ejercicios: ["banco_plano", "dorsalera_abierto", "sentadillas", "press_militar", "biceps_barra_w", "triceps_polea"],
  series: { banco_plano: 3, dorsalera_abierto: 3, sentadillas: 3, press_militar: 2, biceps_barra_w: 2, triceps_polea: 2 } };
DIAS.MB = { nombre: "Mantenimiento B · cuerpo completo", especial: "mantenimiento",
  ejercicios: ["banco_inclinado", "remo_maquina", "estocadas", "vuelos_laterales", "biceps_mancuernas", "fondos"],
  series: { banco_inclinado: 3, remo_maquina: 3, estocadas: 3, vuelos_laterales: 2, biceps_mancuernas: 2, fondos: 2 } };
// Viaje: sin gimnasio, solo con el cuerpo, ~30 min
DIAS.V = { nombre: "Rutina de viaje · sin gimnasio", especial: "viaje",
  ejercicios: ["flexiones", "remo_invertido", "sentadilla_corporal", "estocadas_caminando", "fondos_banco", "puente_gluteos", "gemelos_parado"],
  series: { flexiones: 3, remo_invertido: 3, sentadilla_corporal: 3, estocadas_caminando: 2, fondos_banco: 2, puente_gluteos: 2, gemelos_parado: 2 } };
const ENTRADA_GENERAL = [
  { e: "bici", dosis: "3 min, ritmo suave (en viaje: trote suave en el lugar)", seg: 180, temporizador: true },
  { e: "sentadilla_brazos_arriba", dosis: "10 repeticiones, lento", seg: 40 },
  { e: "flexiones_inclinadas", dosis: "10 repeticiones", seg: 40 },
  { e: "gran_estiramiento", dosis: "3 por lado", seg: 60 },
];
CALENTAMIENTO.MA = ENTRADA_GENERAL.concat([{ e: "banco_plano", dosis: "Aproximación: barra sola × 12, después un 50% × 8", seg: 120 }]);
CALENTAMIENTO.MB = ENTRADA_GENERAL.concat([{ e: "banco_inclinado", dosis: "Aproximación: 2 series livianas de 12 y 8", seg: 120 }]);
CALENTAMIENTO.V = ENTRADA_GENERAL.slice();

// ---------- Entrenador ----------
REGLAS.volumen = { min: 10, max: 20 };   // series efectivas por músculo por semana (directa = 1, indirecta = 0,5)
REGLAS.limiteMantenimiento = 55;          // minutos
REGLAS.limiteCorto = 60;                  // cuando hay poco tiempo por agenda o estrés
REGLAS.vueltaDias = 10;                   // si pasaron más días sin entrenar, la primera sesión baja 10% el peso
REGLAS.toleranciaMin = 10;                // si el plan completo se pasa del límite hasta 10 min, no se recorta
const MUSCULOS_SEMANA = ["pecho", "espalda", "hombros", "biceps", "triceps", "cuadriceps", "isquios", "gluteos", "gemelos"];

// =====================================================================
// RUTINA 2 (11/10): 4 días, combina la Rutina 1 y la Rutina 2 de Emiliano + hip thrust.
// Motivo: la parte de arriba pasaba de 20 series por semana y las piernas quedaban cortas.
// Orden pensado para respetar 48 h: después de pecho van piernas, después espalda, después hombros/posterior.
// =====================================================================
const RUTINA_VERSION = 2;
// Nombres de los días de la rutina anterior (para que el historial viejo se siga viendo bien)
const NOMBRES_RUTINA1 = { 1: DIAS[1].nombre, 2: DIAS[2].nombre, 3: DIAS[3].nombre };
// Día de la rutina nueva que conviene después del último día de la rutina anterior
const SIGUIENTE_DESDE_RUTINA1 = { 1: 2, 2: 4, 3: 1 };

Object.assign(EJERCICIOS, {
 sillon_cuadriceps: {
  nombre: "Sillón de cuádriceps", tipo: "aislamiento", principal: "cuadriceps", secundarios: [], pesoCorporal: false,
  nota: "De la Rutina 2 de Emiliano", gif: "videos/0585-my33uHU.gif",
  pasos: ["Ajustá el asiento y el respaldo para que la rodilla quede alineada con el eje de la máquina.",
    "Sentate con la espalda apoyada y el rodillo sobre los tobillos.",
    "Agarrate de las manijas para no moverte.",
    "Estirá las piernas hasta extender las rodillas, levantando el peso.",
    "Hacé una pausa corta arriba y bajá despacio.",
    "Repetí las repeticiones indicadas."],
  original: "lever leg extension" },
 hip_thrust: {
  nombre: "Hip thrust con barra", tipo: "compuesto", principal: "gluteos", secundarios: ["isquios"], pesoCorporal: false,
  nota: "El mejor ejercicio directo de glúteos (lo agrega el entrenador)", gif: "videos/3562-qg2PGl6.gif",
  pasos: ["Sentate en el piso con la parte alta de la espalda apoyada en el borde de un banco y los pies apoyados, al ancho de la cadera.",
    "Apoyá la barra sobre la cadera (con una almohadilla si hay) y sostenela con las dos manos.",
    "Apretá los glúteos y empujá con los talones para subir la cadera hasta que rodillas, cadera y hombros queden en línea.",
    "Hacé una pausa arriba apretando los glúteos.",
    "Bajá la cadera despacio.",
    "Repetí las repeticiones indicadas."],
  original: "barbell glute bridge two legs on bench" },
 parada_burro: {
  nombre: "Gemelos parada de burro", tipo: "aislamiento", principal: "gemelos", secundarios: [], pesoCorporal: false,
  nota: "De la Rutina 2 de Emiliano", gif: "videos/1253-C9LuR4A.gif",
  pasos: ["Ajustá la máquina a tu altura.",
    "Ponete de frente a la máquina, con las puntas de los pies en la plataforma y los talones afuera.",
    "Apoyá las manos en las manijas para mantener el equilibrio.",
    "Subí los talones lo más alto que puedas, quedando en puntas de pie.",
    "Hacé una pausa arriba y bajá los talones despacio, hasta sentir el estiramiento.",
    "Repetí las repeticiones indicadas."],
  original: "lever donkey calf raise" },
});
Object.assign(EQUIPO, { sillon_cuadriceps: "maquina", hip_thrust: "barra", parada_burro: "maquina" });

const CAL_RUTINA1 = { 1: CALENTAMIENTO[1], 2: CALENTAMIENTO[2], 3: CALENTAMIENTO[3] };
DIAS[1] = { nombre: "Pecho y bíceps",
  ejercicios: ["banco_plano", "banco_inclinado", "aperturas_planas", "aperturas_inclinadas", "biceps_barra_w", "biceps_mancuernas", "biceps_concentrado"] };
DIAS[2] = { nombre: "Piernas · cuádriceps y gemelos",
  ejercicios: ["sentadillas", "estocadas", "sillon_cuadriceps", "gemelos_prensa"],
  series: { sillon_cuadriceps: 4, gemelos_prensa: 4 } };
DIAS[3] = { nombre: "Espalda y tríceps",
  ejercicios: ["dominadas", "remo_maquina", "dorsalera_abierto", "fondos", "triceps_maquina", "triceps_polea"] };
DIAS[4] = { nombre: "Hombros, isquios y glúteos",
  ejercicios: ["press_militar", "vuelos_laterales", "vuelos_posteriores", "camilla_isquios", "hip_thrust", "parada_burro"],
  series: { vuelos_laterales: 4, camilla_isquios: 4 } };
CALENTAMIENTO[1] = CAL_RUTINA1[1];
CALENTAMIENTO[2] = CAL_RUTINA1[3];   // la entrada en calor de piernas
CALENTAMIENTO[3] = CAL_RUTINA1[2];   // la entrada en calor de espalda
CALENTAMIENTO[4] = [
  { e: "bici", dosis: "3 min, ritmo suave", seg: 180, temporizador: true },
  { e: "rotacion_externa", dosis: "12 por brazo, muy liviano", seg: 60 },
  { e: "vuelos_posteriores_livianos", dosis: "12 repeticiones con mancuernas de 3 kg", seg: 40 },
  { e: "gran_estiramiento", dosis: "3 por lado", seg: 60 },
  { e: "puente_gluteos", dosis: "12 repeticiones", seg: 40 },
  { e: "press_militar", dosis: "Aproximación: barra sola × 12, después un 50% del peso de trabajo × 8", seg: 120 },
];
// Copia de la rutina tal como la armamos: el balanceador semanal parte siempre de acá
const RUTINA_BASE = JSON.parse(JSON.stringify({ 1: DIAS[1], 2: DIAS[2], 3: DIAS[3], 4: DIAS[4] }));
const DIAS_RUTINA = [1, 2, 3, 4];

// ---------- Balanceador semanal ----------
// Una vez por semana compara las series reales de cada músculo con la meta (10 a 20) y propone cambios chicos.
REGLAS.balance = {
  cadaDias: 7,          // cada cuánto revisa
  minSesiones: 4,       // entrenamientos normales necesarios en la semana para sacar conclusiones
  excesoSobre: 24,      // recorta solo si un músculo pasa de este número (20 + margen)
  maxSuma: 2,           // como mucho +2 series sobre lo que trae la rutina en un ejercicio
  maxResta: 1,          // como mucho −1 serie sobre lo que trae la rutina
  topeSeries: 5,        // ningún ejercicio pasa de 5 series
  maxCambios: 3,        // cambios por semana (de a poco)
};
// Si un músculo queda corto y la rutina no tiene cómo sumarle, se agrega uno de estos (3 series)
const COMPLEMENTOS = { gluteos: "hip_thrust", cuadriceps: "sillon_cuadriceps", gemelos: "parada_burro", isquios: "camilla_isquios",
  pecho: "aperturas_planas", espalda: "remo_maquina", hombros: "vuelos_laterales", biceps: "biceps_mancuernas", triceps: "triceps_polea" };
