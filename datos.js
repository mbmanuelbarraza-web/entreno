// Catálogo de ejercicios y rutina de Emiliano.
// GIFs e instrucciones: dataset hasaneyldrm/exercises-dataset. Imágenes © Gym visual — https://gymvisual.com/
// Para cambiar la rutina o agregar ejercicios, se edita este archivo.

const GIF_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const ATRIBUCION = "© Gym visual — gymvisual.com";

// Reglas (se pueden cambiar sin tocar el resto de la app)
const REGLAS = {
  compuesto:   { series: 4, repsMin: 6,  repsMax: 10, descanso: 120 },
  aislamiento: { series: 3, repsMin: 10, repsMax: 15, descanso: 75 },
  pasoPeso: 1,          // kg que suben/bajan los botones + y − (se cambia por ejercicio)
  avisoPrevio: 10,      // segundos antes del fin del descanso
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
