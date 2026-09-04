import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Condiciones para utilizar la plataforma MultiLinks.",
  alternates: { canonical: "/terminos" },
};

const sections: LegalSection[] = [
  { title: "Aceptación de los términos", paragraphs: ["Al crear una cuenta o utilizar MultiLinks aceptas estas condiciones. Si no estás de acuerdo, no debes utilizar la plataforma. Estos términos se aplican a visitantes, usuarios registrados y administradores de páginas públicas."] },
  { title: "Cuenta y seguridad", paragraphs: ["Debes proporcionar información válida, mantener seguras tus credenciales y notificarnos si detectas un acceso no autorizado. Eres responsable del contenido y actividad asociados con tu cuenta."], bullets: ["Debes tener capacidad legal para aceptar estas condiciones.", "No puedes compartir credenciales ni intentar acceder a cuentas ajenas.", "Podemos solicitar confirmación del correo o medidas adicionales de seguridad."] },
  { title: "Uso permitido", paragraphs: ["MultiLinks permite crear una página para organizar y compartir enlaces, contenido, redes, proyectos o información profesional. Debes utilizar el servicio conforme a la ley y respetar los derechos de otras personas."], bullets: ["No publiques malware, fraude, spam o enlaces engañosos.", "No acoses, suplantes ni expongas información privada de terceros.", "No publiques contenido ilegal o que vulnere propiedad intelectual.", "No intentes evadir límites, controles de acceso o medidas de seguridad."] },
  { title: "Contenido y enlaces", paragraphs: ["Conservas los derechos sobre el contenido que publicas. Nos autorizas de manera limitada a alojarlo, procesarlo y mostrarlo únicamente para operar MultiLinks. No controlamos ni respaldamos sitios externos enlazados por los usuarios."], bullets: ["Eres responsable de contar con permisos para imágenes, marcas y contenido que publiques.", "Podemos retirar o limitar contenido reportado mientras se revisa.", "Los enlaces externos tienen sus propias condiciones y políticas."] },
  { title: "Moderación y suspensión", paragraphs: ["Podemos investigar reportes, ocultar perfiles, suspender o cerrar cuentas cuando exista incumplimiento, riesgo de seguridad, fraude o requerimiento legal. Cuando sea razonable, permitiremos que el usuario contacte a soporte para solicitar revisión."], bullets: ["Las acciones administrativas quedan registradas para auditoría.", "Un reporte no produce una sanción automática; se revisa según la información disponible.", "Podemos preservar registros cuando sea necesario para seguridad o cumplimiento legal."] },
  { title: "Planes y pagos", paragraphs: ["MultiLinks puede ofrecer planes gratuitos y de pago. Antes de activar un cobro mostraremos el precio, periodicidad y características aplicables. Las condiciones específicas del proveedor de pagos también podrán aplicar." ] },
  { title: "Disponibilidad del servicio", paragraphs: ["Trabajamos para mantener la plataforma disponible y segura, pero no garantizamos funcionamiento ininterrumpido. Podemos realizar mantenimiento, corregir errores, modificar funciones o interrumpir temporalmente el servicio cuando sea necesario."] },
  { title: "Terminación", paragraphs: ["Puedes dejar de usar MultiLinks en cualquier momento. La eliminación de cuenta podrá solicitarse mediante soporte hasta que exista una opción automatizada. Algunas copias o registros mínimos pueden conservarse por seguridad, obligaciones legales o resolución de disputas."] },
  { title: "Responsabilidad", paragraphs: ["En la medida permitida por la legislación aplicable, MultiLinks no será responsable por contenido de usuarios, sitios externos, pérdidas indirectas o decisiones tomadas a partir de enlaces publicados. Nada en estos términos limita derechos que legalmente no puedan excluirse."] },
  { title: "Cambios y contacto", paragraphs: ["Podemos actualizar estos términos para reflejar cambios del servicio, seguridad o requisitos legales. Publicaremos la fecha de vigencia y, cuando el cambio sea relevante, procuraremos comunicarlo. Para preguntas utiliza el Centro de Ayuda o escribe a axccolas@gmail.com."] },
];

export default function TermsPage() { return <LegalPage eyebrow="CONDICIONES CLARAS" title="Términos de Servicio" intro="Las reglas básicas para crear, compartir y administrar una página en MultiLinks de forma responsable." sections={sections}/>; }
