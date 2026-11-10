# Del papel al objeto

> Exposición virtual sobre la occidentalización de la cultura popular japonesa y la formación de colecciones.

## Sobre el proyecto

**Del papel al objeto** propone una experiencia museal virtual para explorar cómo personajes y narrativas de la cultura popular japonesa circulan en Occidente y se convierten en objetos coleccionables. La exposición relaciona cinco piezas y cierra con una pregunta para el visitante: **¿qué convierte un grupo de objetos en una colección?**

La experiencia está dirigida tanto a aficionados al manga, el anime y los juegos de cartas como a visitantes sin conocimientos previos. La identidad visual tendrá un carácter geek y de cultura pop, con acentos gráficos por estación y una sala legible que mantenga las piezas en primer plano.

## Objetivos de experiencia

- Recorrer libremente una sala virtual compacta con cinco estaciones.
- Reconocer qué es cada objeto y comprender su relación con la cultura popular japonesa, incluso sin conocer previamente sus franquicias.
- Observar cómo cambia un personaje al pasar entre formatos impresos, cartas, figuras y objetos textiles.
- Distinguir entre acumulación, inventario y colección, y proponer un criterio propio para agrupar las piezas.
- Usar la experiencia desde computador y móvil con controles adecuados a cada dispositivo.

## Recorrido y contenido

| Estación | Tema | Contenido e interacción prevista |
|---|---|---|
| A. Bienvenida | Orientación | Introducción a la pregunta curatorial, instrucciones de navegación y acceso a una sugerencia de recorrido. |
| B. El papel, el origen | Manga y narrativa gráfica | Tomo de *Yu-Gi-Oh!*; contexto editorial y lectura; visualización de páginas cuando los materiales estén disponibles. |
| C. Del personaje al producto | Licencia y producción comercial | Deck de Kaiba y figuras Funko Pop de Yuji Itadori y Gon Freecss; inspección de piezas y comparador papel–figura. |
| D. El ídolo que se vuelve objeto | De lo digital a lo tangible | Peluche de Hatsune Miku; explicación de la cultura de ídolos virtuales y de su materialización textil. |
| E. ¿Qué hace una colección? | Criterio curatorial | Actividad para agrupar los cinco objetos con un criterio propio y compararlo con el criterio de la exposición. |

El visitante podrá moverse sin un orden obligatorio. Se ofrecerá una orientación inicial y señales dentro de la sala para ayudar a encontrar las estaciones. Los textos principales serán breves y claros; el vocabulario especializado podrá explicarse mediante ayudas complementarias.

## Alcance de la primera versión

### Incluido

- Sala 3D compacta y navegable libremente.
- Las cinco estaciones y sus textos curatoriales principales.
- Interacción para inspeccionar las piezas (giro y acercamiento cuando el modelo lo permita).
- Comparador papel–figura en la estación C, sujeto a contar con imágenes o modelos adecuados.
- Actividad de clasificación y pregunta de cierre en la estación E.
- Controles para escritorio y móvil, interfaz adaptable y orientación básica.
- Accesibilidad inicial: textos legibles, contraste suficiente, instrucciones visibles y alternativa textual para información visual importante.
- Publicación web compartible y documentación para ejecutar y actualizar el proyecto.

### Fuera del alcance inicial

- Realidad virtual con visor.
- Mediación en vivo, chat o asistentes con inteligencia artificial.
- Modelado de alta complejidad para cada pieza antes de validar navegación y rendimiento.
- Una experiencia 2D con el mismo nivel de desarrollo que la sala 3D.

## Tecnología y criterios técnicos

La opción inicial es **PlayCanvas** para la sala 3D en navegador. La decisión se validará con una prueba temprana de navegación en escritorio y móvil. Los modelos se prepararán en Blender y se integrarán en un formato web optimizado como glTF/GLB.

El rendimiento móvil se tratará como requisito de diseño: geometría y texturas optimizadas, iluminación contenida, pocos efectos costosos y carga progresiva de recursos cuando sea posible. Durante el desarrollo se utilizarán modelos provisionales para que la sala y las interacciones avancen en paralelo al modelado final.

### Controles previstos

| Acción | Escritorio | Móvil |
|---|---|---|
| Moverse | WASD o flechas | Joystick virtual |
| Mirar alrededor | Ratón | Arrastrar sobre la vista |
| Interactuar | Clic o tecla indicada en pantalla | Toque sobre el objeto o botón |
| Cerrar panel | Esc o botón de cierre | Botón de cierre visible |

Los controles finales se confirmarán en el prototipo y se mostrarán en la experiencia.

## Materiales disponibles y dependencias

Al inicio se cuenta con fotografías de los objetos. Estas servirán como referencia para proporciones, color y detalles durante el modelado. El equipo producirá los modelos 3D y aportará los materiales visuales que se acuerden para páginas, empaques y comparaciones.

Antes de cerrar cada pieza se deberán registrar sus datos de identificación y procedencia, y confirmar los materiales que pueden incorporarse a la exposición. La estación del manga contempla una adquisición propuesta en el guion; su representación y rotulación deben distinguir claramente una pieza propuesta de una pieza efectivamente disponible.

## Plan de trabajo: una semana

| Día | Enfoque | Entregable |
|---|---|---|
| 1 | Definir plano de sala, flujo libre, controles, textos prioritarios y criterios de aceptación. | Mapa de estaciones y lista de tareas cerrada. |
| 2 | Montar la sala base y validar movimiento e interacción en escritorio y móvil. | Recorrido 3D navegable con estaciones identificadas. |
| 3 | Integrar paneles, cédulas, orientación y contenido de las cinco estaciones. | Exposición completa en contenido. |
| 4 | Integrar modelos provisionales o finales; añadir inspección de piezas y comparador. | Piezas explorables y comparación funcional. |
| 5 | Implementar actividad de clasificación y cierre curatorial. | Interacción final conectada con los objetivos de aprendizaje. |
| 6 | Ajustar interfaz móvil, legibilidad, carga y accesibilidad básica. | Versión adaptable revisada en los dispositivos disponibles. |
| 7 | Corregir problemas, publicar y documentar uso y actualización. | Enlace compartible y README actualizado con instrucciones reales. |

## Criterios de cierre

- Se puede entrar a la sala y recorrer libremente sus cinco estaciones.
- Una persona nueva entiende cómo moverse y puede identificar qué está observando.
- Los textos y paneles se leen sin bloquear innecesariamente la vista o el desplazamiento.
- La inspección de objetos, el comparador previsto y la actividad final funcionan con los recursos disponibles.
- La experiencia se puede abrir desde un navegador de escritorio y desde un navegador móvil actual.
- El proyecto queda publicado y este README incluye los pasos reales para ejecutarlo y actualizar sus recursos.

## Ejecución

Las instrucciones de ejecución se completarán cuando se confirme la estructura del proyecto PlayCanvas y su forma de publicación. Esta sección debe incluir, como mínimo, requisitos, configuración, ejecución local o apertura del proyecto en PlayCanvas, publicación y actualización de modelos.

## Créditos y fuentes

- Guion museológico, curatorial, museográfico, educativo y de mediación: documento del proyecto *Del papel al objeto*.
- Modelado y recursos visuales: equipo del proyecto (por completar).
- Referencias y créditos específicos de piezas, imágenes y materiales: por completar antes de publicar.
