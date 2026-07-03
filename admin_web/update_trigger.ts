import { prisma } from './lib/db';

async function main() {
  try {
    const sql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.users (id, nip, full_name, division_id, role, email, mfa_enabled)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nip',
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'division_id')::INT,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'EMPLOYEE'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'mfa_enabled')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
    `;
    
    await prisma.$executeRawUnsafe(sql);
    console.log("Trigger function updated successfully!");

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
