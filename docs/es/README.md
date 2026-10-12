# Casa — Control de finanzas del hogar

Aplicación para gestionar las finanzas compartidas de un hogar, diseñada primero para dispositivos móviles. Permite registrar y revisar rápidamente ingresos, gastos y transferencias. Está pensada para un hogar de dos personas, utiliza EUR y trata las cuentas bancarias, el efectivo y los ahorros como fuentes de dinero equivalentes (`fuentes`).

La misma aplicación React puede ejecutarse como:

- Aplicación web adaptable en un navegador de escritorio o móvil.
- Aplicación Android nativa mediante Capacitor.
- Aplicación iOS mediante Capacitor cuando se compila en macOS.

## Funcionalidades

- Autenticación mediante correo electrónico y contraseña, con lista blanca de correos opcional.
- Sesiones persistentes de Supabase.
- Modo de demostración local cuando Supabase no está configurado.
- Selector de operaciones rápido y táctil para:
  - Ingresos (`Ingreso`)
  - Gastos (`Gasto`)
  - Transferencias (`Transferencia`)
- Campo de importe con enfoque automático para agilizar la entrada.
- Fuente predeterminada por usuario.
- Transferencias entre fuentes registradas.
- Seguimiento de la responsabilidad sobre fuentes compartidas.
- Operaciones recurrentes semanales, mensuales y anuales, con controles para pausarlas y eliminarlas en Configuración.
- Categorías del hogar y subcategorías dependientes.
- Historial de operaciones con filtros por fuente, fecha, categoría y subcategoría.
- Edición y eliminación de operaciones propias con corrección automática del saldo.
- Combinación de varias operaciones propias, que no sean transferencias y pertenezcan a la misma fuente, en una operación neta. Las combinaciones de valor cero se cancelan.
- Panel con:
  - Saldo total disponible.
  - Distribución del saldo por fuente.
  - Ingresos frente a gastos mensuales.
  - Filtrado por fuente.
  - Desglose de gastos por categoría.
- Diseños adaptables y compatibilidad con las áreas seguras de dispositivos móviles.

## Terminología del dominio

### Fuentes (`sources`)

Una fuente es cualquier contenedor de dinero, como una cuenta bancaria, efectivo físico o una cuenta de ahorro. Un valor `owner` vacío indica que la fuente es compartida por el hogar.

### Operaciones (`operations`)

La aplicación utiliza el término **operación** en lugar de transacción. Una operación puede ser:

- `income`: aumenta el saldo de la fuente seleccionada.
- `expense`: reduce el saldo de la fuente seleccionada.
- `transfer`: reduce el saldo de la fuente de origen y aumenta el de la fuente de destino por el mismo importe.

Los importes siempre se almacenan como números positivos. Todos los valores monetarios utilizan EUR (€).

### Categorías

Las categorías incluidas son:

- `HOGAR`: nómina, comida, alquiler, suscripciones, internet, luz
- `TRANSPORTE`: gasolina, transporte público, avión
- `ACTIVIDADES`: gimnasio, cerámica, yoga, baloncesto
- `OCIO`: hostelería, cine, otro
- `EXTRA`: regalos, bizum, proyectos, peluquería, ropa, salud, coche
- `DESCONOCIDO`: sin subcategorías

Las transferencias no utilizan categoría ni subcategoría y se almacenan con `desconocido` como identificador de categoría.

## Tecnologías

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Capacitor 7
- Supabase
- Lucide React
- Recharts

## Estructura del proyecto

```text estructura-del-proyecto
src/
├── components/          Componentes de interfaz compartidos
├── data/                Datos iniciales de categorías
├── features/
│   ├── app/             Estado y navegación de la aplicación
│   ├── auth/            Vista de inicio de sesión
│   ├── dashboard/       Gráficos y resumen financiero
│   ├── operations/      Formulario, historial, filtros, edición, eliminación y combinación
│   └── settings/        Valores predeterminados, operaciones recurrentes y cierre de sesión
├── hooks/               Hooks de React compartidos
├── services/            Cliente de Supabase y API de datos
├── types/               Interfaces de dominio de TypeScript
├── App.tsx              Selector de vistas principal
├── index.css            Tailwind y estilos globales
└── main.tsx             Punto de entrada de React
```

El proyecto utiliza un selector de vistas sencillo en lugar de un enrutador de URL. Las sesiones autenticadas comienzan en el selector de operaciones para agilizar la entrada manual.

## Requisitos previos

### Desarrollo web

Instala:

- Node.js 20 o posterior
- npm
- Git

### Desarrollo para Android

Además de los requisitos web, instala:

- Android Studio
- Android SDK y SDK Platform Tools
- Un emulador Android configurado o un dispositivo Android con depuración USB activada
- Una versión compatible de Java/JDK, administrada o recomendada por Android Studio

## Instalación desde el código fuente

Clona el repositorio y entra en su directorio:

```bash terminal
 git clone https://github.com/Franm99/ControlFinanciero.git
 cd ControlFinanciero
```

Instala las dependencias:

```bash terminal
npm install
```

Inicia el servidor de desarrollo:

```bash terminal
npm run dev
```

Abre la URL local mostrada por Vite, normalmente:

```text navegador
http://localhost:5173/
```

## Configuración del entorno

Crea un archivo `.env.local` en la raíz del proyecto, junto a `package.json`, para conectar la aplicación con Supabase. Git ignora este archivo:

```dotenv .env.local
VITE_SUPABASE_URL=https://referencia-del-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=clave-anonima-o-publicable
VITE_ALLOWED_EMAILS=persona1@example.com,persona2@example.com
```

Localiza los valores en el panel de Supabase:

1. Abre el proyecto y selecciona **Connect**, o entra en **Project Settings → API**.
2. Copia **Project URL** en `VITE_SUPABASE_URL`.
3. Copia la clave de cliente **anon** de proyectos antiguos o la clave **publishable** en `VITE_SUPABASE_ANON_KEY`. La variable conserva este nombre aunque se utilice una clave publicable.
4. Añade en `VITE_ALLOWED_EMAILS` los correos autorizados para el hogar, separados por comas y sin comillas. Deben coincidir con los usuarios de Auth creados más adelante.
5. Guarda el archivo y reinicia `npm run dev`. Si los valores se utilizan en Android, vuelve a compilar y sincronizar Capacitor.

Los valores que empiezan por `VITE_` se incluyen en el paquete del frontend. Utiliza aquí únicamente la clave anónima o publicable de Supabase. **Nunca añadas una contraseña de base de datos, un token de acceso personal, una clave secreta o la clave `service_role` de Supabase.** Vite también admite `.env`, pero se recomienda `.env.local` para valores específicos del equipo y nunca debe subirse al repositorio.

### Lista blanca de correos

`VITE_ALLOWED_EMAILS` es una lista separada por comas. La comparación no distingue entre mayúsculas y minúsculas y elimina los espacios de los extremos.

Si la lista existe, solo las direcciones incluidas podrán continuar con la autenticación de Supabase. Para una seguridad real, aplica la misma restricción en Supabase y mediante Row Level Security. Una variable del frontend no constituye por sí sola una barrera de seguridad.

## Modo de demostración local

Cuando falta `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, la aplicación funciona en modo de demostración local.

Utiliza cualquier correo válido y una contraseña no vacía, por ejemplo:

```text credenciales-de-demostracion
Correo: demo@casa.es
Contraseña: demo
```

El modo de demostración proporciona fuentes de ejemplo y guarda el correo de la sesión en el almacenamiento local del navegador. Las operaciones y los cambios de saldo se mantienen en el estado de React y se pierden al actualizar la página. Este modo solo está pensado para evaluar la interfaz y desarrollar localmente.

## Crear y configurar una base de datos de Supabase

[Supabase](https://supabase.com/) es una plataforma PostgreSQL alojada. La aplicación la utiliza para la autenticación por correo y contraseña, el almacenamiento, Row Level Security (RLS), las funciones de base de datos y las operaciones recurrentes programadas. Un proyecto gratuito es suficiente para desarrollo.

### 1. Crear una cuenta y un proyecto

1. Crea una cuenta en [supabase.com](https://supabase.com/) e inicia sesión.
2. Selecciona **New project**, elige una organización, escribe un nombre y genera una contraseña segura para la base de datos. Guárdala en un gestor de contraseñas; no debe incluirse en el archivo de entorno del frontend.
3. Selecciona la región más cercana al hogar, crea el proyecto y espera a que termine el aprovisionamiento.
4. En **Authentication → Providers**, comprueba que Email esté activado y decide si los correos deben confirmarse.

Empieza con un proyecto vacío. La migración es una instantánea completa del esquema y no está diseñada para aplicarse sobre tablas existentes con los mismos nombres.

### 2. Instalar y conectar la CLI de Supabase en Windows 11

La CLI de Supabase ya aparece como dependencia de desarrollo. Después de `npm install`, puedes ejecutarla mediante `npx` sin instalarla globalmente.

1. En el panel de Supabase, abre el menú de la cuenta, entra en **Account Settings → Access Tokens** y genera un token de acceso personal. Cópialo en ese momento y mantenlo privado. Este token controla la CLI y no debe incluirse en `.env.local` ni en Git.
2. Localiza la referencia del proyecto en **Project Settings → General** (Reference ID), en la URL del proyecto o en la URL del panel. Es el identificador corto utilizado en `https://<project-ref>.supabase.co`.
3. Desde la raíz del repositorio, autentícate y vincula la carpeta local:

```powershell terminal
npx supabase login --token TU_TOKEN_DE_ACCESO_PERSONAL
npx supabase link --project-ref REFERENCIA_DEL_PROYECTO
```

La opción correcta es `--project-ref`, con guion, no `--project_ref`. El proceso de vinculación puede solicitar la contraseña de la base de datos. Comprueba la conexión con:

```powershell terminal
npx supabase projects list
npx supabase migration list
```

Algunas operaciones de la CLI, especialmente `npx supabase start`, los reinicios de la base de datos local, la comparación de migraciones y la validación local, ejecutan contenedores de Supabase. En Windows 11, instala WSL 2 y Docker Desktop, activa el motor WSL 2 de Docker y comprueba que Docker Desktop esté ejecutándose. Vincular o enviar cambios a un proyecto alojado puede no requerir Docker, pero se recomienda tenerlo para desarrollar migraciones.

### 3. Importar la última migración completa

Las migraciones se encuentran en `supabase/migrations/`. Utiliza el archivo con la marca temporal o nombre mayor; actualmente es `supabase/migrations/2026_10_12_000001_full_db_migration.sql`. No apliques las dos instantáneas completas a una base de datos nueva.

En un proyecto nuevo, abre **SQL Editor → New query**, pega el contenido completo únicamente de la migración más reciente y selecciona **Run**. Esta es la importación inicial más segura mientras el repositorio contenga más de una instantánea completa. No ejecutes `npx supabase db push --include-all` tal como está contra un proyecto vacío, porque podría intentar aplicar las dos instantáneas. Después de importar, utiliza `npx supabase migration list` para revisar el estado. Las futuras migraciones incrementales pueden utilizar `npx supabase db push` cuando el historial esté reconciliado y solo aparezcan los archivos pendientes deseados.

Revisa el SQL antes de ejecutarlo. La migración completa crea las extensiones de PostgreSQL, el enum `operation_type`, las tablas, claves foráneas, políticas RLS, permisos, funciones y tareas necesarias. La aplicación utiliza:

- Tablas: `profiles`, `sources`, `operations`, `recurrent_operations` y `user_settings`.
- Funciones RPC: `add_operation`, `update_operation`, `delete_operation` y `combine_operations`.
- Procesador de recurrencias: `process_recurrent_operations`.

Después de importar, revisa **Database → Tables**, **Database → Functions**, **Database → Extensions** e **Integrations → Cron**. Comprueba si existe la tarea recurrente:

```sql tarea-recurrente-supabase.sql
select jobid, jobname, schedule, command
from cron.job
where jobname = 'process-recurrent-operations';
```

Si no existe, créala una sola vez en SQL Editor. Este ejemplo se ejecuta todos los días a las 00:05 UTC; selecciona una hora UTC adecuada para el hogar:

```sql tarea-recurrente-supabase.sql
select cron.schedule(
  'process-recurrent-operations',
  '5 0 * * *',
  $$select public.process_recurrent_operations();$$
);
```

No crees tareas duplicadas ni invoques manualmente el procesador más de una vez en una fecha de vencimiento, ya que cada ejecución vuelve a crear las operaciones correspondientes.

### 4. Crear usuarios de Auth, perfiles y fuentes

Los usuarios de autenticación y los perfiles de la aplicación son registros distintos, pero deben compartir el mismo UUID.

1. Entra en **Authentication → Users → Add user** y crea cada usuario del hogar. Utiliza los mismos correos definidos en `VITE_ALLOWED_EMAILS`, establece sus contraseñas y marca los correos como confirmados si corresponde.
2. Copia el UUID de cada usuario desde la página Users.
3. En **Database → Table Editor → profiles**, crea un perfil por usuario de Auth. Asigna al campo `id` el UUID copiado, a `email` el correo exacto y a `name` el nombre visible. No permitas que `profiles.id` genere un UUID diferente.
4. En `sources`, crea al menos una fuente de dinero. `name` debe ser único, `balance` contiene el saldo inicial y `description` es opcional. Utiliza `NULL` en `owner` para una fuente compartida o el UUID de un perfil para una fuente personal.
5. En `user_settings`, puedes añadir una fila por perfil. `user_id` es el UUID del perfil y `default_source_id` es el ID de una fuente existente. Si se omite, la aplicación elige inicialmente la primera fuente disponible; guardar la Configuración crea o actualiza esta fila.

También puedes preparar estos datos desde SQL Editor después de sustituir todos los marcadores por valores reales:

```sql datos-iniciales-hogar.sql
insert into public.profiles (id, email, name) values
  ('UUID-USUARIO-AUTH-1', 'persona1@example.com', 'Persona 1'),
  ('UUID-USUARIO-AUTH-2', 'persona2@example.com', 'Persona 2');

insert into public.sources (name, balance, description, owner) values
  ('Cuenta compartida', 0, 'Cuenta corriente del hogar', null),
  ('Efectivo Persona 1', 0, 'Efectivo personal', 'UUID-USUARIO-AUTH-1');

-- Consulta primero public.sources para obtener los ID numéricos generados.
insert into public.user_settings (user_id, default_source_id) values
  ('UUID-USUARIO-AUTH-1', ID_FUENTE),
  ('UUID-USUARIO-AUTH-2', ID_FUENTE);
```

Normalmente, `operations` debe comenzar vacía y llenarse desde la aplicación para que las funciones RPC actualicen los saldos de forma atómica. Las operaciones recurrentes también se crean normalmente desde el formulario y se administran en Configuración.

### 5. Configurar y comprobar la aplicación

Crea `.env.local` según la sección [Configuración del entorno](#configuración-del-entorno) y reinicia el servidor. Inicia sesión con cada usuario y comprueba que:

1. Se cargan los perfiles y las fuentes compartidas o personales permitidas.
2. Se puede guardar la fuente predeterminada.
3. Los ingresos, gastos y transferencias modifican correctamente los saldos.
4. El historial permite filtrar, editar, eliminar y combinar operaciones propias.
5. No se pueden editar ni eliminar las operaciones de otro usuario.
6. Se puede crear, pausar y eliminar una operación recurrente.

Las funciones de base de datos aplican los cambios de saldo de forma atómica. Una actualización revierte el efecto anterior antes de aplicar el nuevo; la eliminación revierte el efecto; y la combinación calcula el neto de operaciones propias que no sean transferencias y pertenezcan a una misma fuente. Si el neto es cero, las operaciones se eliminan sin crear otra.

Antes de almacenar información financiera real, revisa todas las políticas RLS para el modelo de hogar deseado. Las políticas incluidas son un punto de partida, no sustituyen una auditoría de seguridad. Asegúrate de que los usuarios autenticados solo puedan acceder a los perfiles, fuentes, operaciones, recurrencias y ajustes correspondientes, y de que no puedan eludir las funciones RPC para modificar saldos directamente. Prueba primero la migración y las reversiones en un proyecto que no sea de producción.

## Compilar la aplicación web

Crea una compilación optimizada para producción:

```bash terminal
npm run build
```

La aplicación generada se guarda en `dist/`.

Previsualiza localmente la compilación:

```bash terminal
npm run preview
```

Puedes desplegar `dist/` en un alojamiento estático como Netlify, Vercel, Cloudflare Pages o un servidor web convencional. Configura las mismas variables `VITE_*` en el proveedor antes de compilar.

## Probar en un teléfono mediante Wi-Fi

La configuración de Vite expone el servidor de desarrollo a la red local.

1. Conecta el ordenador y el teléfono a la misma red Wi-Fi.
2. Inicia Vite:

```bash terminal
npm run dev
```

3. Abre en el teléfono la URL `Network` mostrada por Vite, por ejemplo:

```text navegador
http://192.168.1.50:5173/
```

Si no aparece una URL de red, consulta la dirección IPv4 del ordenador en Windows:

```powershell terminal
ipconfig
```

Utiliza esa dirección con el puerto `5173`. Si el teléfono no puede conectarse, comprueba que la red no aísle los dispositivos y que el cortafuegos permita el servidor de desarrollo.

Para detener un servidor que se ejecuta en otra terminal de Windows, localiza y detén su proceso de Node:

```powershell terminal
Get-Process node | Stop-Process
```

## Ejecutar como aplicación Android

### 1. Añadir el proyecto nativo de Android

Este paso solo es necesario una vez por clon si no existe el directorio `android/`:

```bash terminal
npm run build
npx cap add android
```

### 2. Sincronizar la aplicación web

Compila el frontend y copia sus archivos en el proyecto Android:

```bash terminal
npm run build
npx cap sync android
```

El siguiente script también sincroniza todas las plataformas instaladas después de compilar:

```bash terminal
npm run cap:sync
```

### 3. Abrir Android Studio

```bash terminal
npx cap open android
```

Espera a que Android Studio termine la sincronización de Gradle e instala los componentes SDK solicitados.

### 4. Ejecutar en un dispositivo Android físico

1. Activa las Opciones para desarrolladores en el teléfono.
2. Activa la depuración USB.
3. Conecta el teléfono con un cable USB de datos.
4. Autoriza la depuración cuando el teléfono lo solicite.
5. Selecciona el dispositivo en Android Studio.
6. Pulsa **Run**.

También puedes crear un Android Virtual Device desde Device Manager y ejecutar la aplicación en el emulador.

### 5. Aplicar cambios del frontend a Android

Después de modificar archivos React, TypeScript o CSS, vuelve a compilar y sincronizar:

```bash terminal
npm run build
npx cap sync android
```

Después, ejecuta otra vez la aplicación desde Android Studio.

### Preparar una versión de Android

Antes de distribuir la aplicación:

1. Sustituye el identificador o nombre predeterminado en `capacitor.config.ts` si es necesario.
2. Configura el icono y la pantalla de inicio.
3. Confirma los valores de producción de Supabase.
4. Prueba la persistencia de la autenticación y los estados sin conexión o de error en un dispositivo real.
5. Incrementa la versión de Android.
6. Genera una clave de firma y guárdala de forma segura.
7. Genera un Android App Bundle firmado desde Android Studio.
8. Sube el paquete a Google Play Console y completa las declaraciones de privacidad y seguridad de datos.

No subas claves de firma, contraseñas, `.env.local` ni credenciales `service_role` de Supabase.

## Compilación opcional para iOS

Las compilaciones nativas de iOS requieren macOS y Xcode. Probar la versión web en un iPhone no requiere Xcode.

En un Mac, añade y abre el proyecto nativo:

```bash terminal
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Selecciona un equipo de desarrollo y un perfil de firma en Xcode y ejecuta la aplicación en un iPhone o simulador.

## Scripts disponibles

| Script | Finalidad |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Comprueba los tipos y genera la compilación web de producción. |
| `npm run preview` | Previsualiza localmente la compilación de producción. |
| `npm run cap:sync` | Sincroniza los archivos web compilados con las plataformas de Capacitor instaladas. |

## Flujo de desarrollo

Ciclo habitual de desarrollo web:

```bash terminal
npm install
npm run dev
```

Ciclo habitual de Android después de añadir la plataforma:

```bash terminal
npm run build
npx cap sync android
npx cap open android
```

Antes de confirmar cambios, comprueba la compilación de producción:

```bash terminal
npm run build
```

## Seguridad y datos

- La información financiera es sensible. Utiliza RLS y políticas limitadas al hogar en producción.
- Los saldos solo deben modificarse mediante funciones de base de datos atómicas y de confianza.
- La lista blanca del frontend mejora la experiencia, pero no sustituye la autorización del backend.
- Nunca expongas la clave `service_role` de Supabase en una aplicación Vite.
- Utiliza HTTPS en los despliegues web.
- Define procedimientos de copia de seguridad y recuperación antes de depender de la aplicación.
- Revisa cómo se gestionarán la eliminación de cuentas, la exportación, la retención y las solicitudes de privacidad antes de distribuir públicamente la aplicación.

## Solución de problemas

### El inicio de sesión acepta cualquier contraseña

Supabase no está configurado y la aplicación funciona en modo de demostración. Añade variables de entorno válidas y reinicia Vite para utilizar la autenticación real.

### No se aplican los cambios de entorno

Detén y reinicia `npm run dev`. Vite lee los archivos de entorno al arrancar.

### Android sigue mostrando una interfaz anterior

Vuelve a compilar y sincronizar:

```bash terminal
npm run build
npx cap sync android
```

### La plataforma Android no existe

Añádela una vez:

```bash terminal
npx cap add android
```

### El teléfono no puede acceder al servidor de Vite

Comprueba que el ordenador y el teléfono estén en la misma red, utiliza la URL `Network` en lugar de `localhost` y verifica que la red no aísle los clientes inalámbricos.

### Advertencia sobre el tamaño del paquete de producción

Recharts y sus dependencias pueden hacer que el paquete JavaScript inicial sea grande. La advertencia no impide compilar. Más adelante se puede añadir carga diferida por rutas y fragmentos manuales de Vite para mejorar el tiempo de carga inicial.
