import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

interface DatosCorreo {
  para: string;
  asunto: string;
  html: string;
}

export type ResultadoCorreo = { ok: true; id: string } | { ok: false; error: string };

export async function obtenerClaveResend(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  return getToken('resend/priceverify', { subject: { type: 'app' } });
}

export async function enviarCorreo({
  para,
  asunto,
  html,
}: DatosCorreo): Promise<ResultadoCorreo> {
  try {
    const resend = new Resend(await obtenerClaveResend());
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: para,
      subject: asunto,
      html,
    });

    if (error) {
      return { ok: false, error: error.message || 'No se pudo enviar el correo.' };
    }
    if (!data?.id) {
      return { ok: false, error: 'Resend no devolvió la confirmación del envío.' };
    }

    return { ok: true, id: data.id };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
    };
  }
}
