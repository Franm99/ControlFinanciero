


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."operation_type" AS ENUM (
    'income',
    'expense',
    'transfer'
);


ALTER TYPE "public"."operation_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_operation"("p_type" "public"."operation_type", "p_amount" numeric, "p_source_id" integer, "p_destination_source_id" integer DEFAULT NULL::integer, "p_category_id" "text" DEFAULT 'desconocido'::"text", "p_subcategory_id" "text" DEFAULT NULL::"text", "p_date" "date" DEFAULT CURRENT_DATE, "p_description" "text" DEFAULT NULL::"text", "p_created_by" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_op_id integer;
begin
  -- 1. Insertar la operación
  insert into public.operations (
    type, 
    amount, 
    source_id, 
    destination_source_id, 
    category, 
    subcategory, 
    date, 
    description, 
    created_by
  )
  values (
    p_type, 
    p_amount, 
    p_source_id, 
    p_destination_source_id, 
    p_category_id, 
    p_subcategory_id, 
    p_date, 
    p_description, 
    coalesce(p_created_by, auth.uid()) -- Si mandas ID usa ese, si viene null pilla el del usuario logueado
  )
  returning id into v_op_id;

  -- 2. Actualizar los saldos de las cuentas/fuentes afectadas
  if p_type = 'expense' then
    update public.sources 
    set balance = balance - p_amount 
    where id = p_source_id;

  elsif p_type = 'income' then
    update public.sources 
    set balance = balance + p_amount 
    where id = p_source_id;

  elsif p_type = 'transfer' then
    update public.sources 
    set balance = balance - p_amount 
    where id = p_source_id;
    
    update public.sources 
    set balance = balance + p_amount 
    where id = p_destination_source_id;
  end if;

  return v_op_id;
end;
$$;


ALTER FUNCTION "public"."add_operation"("p_type" "public"."operation_type", "p_amount" numeric, "p_source_id" integer, "p_destination_source_id" integer, "p_category_id" "text", "p_subcategory_id" "text", "p_date" "date", "p_description" "text", "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_recurrent_operations"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_rec record;
  v_is_due boolean;
  v_last_day_of_month int;
begin
  -- Iterar sobre todas las operaciones recurrentes que estén activas y cuya fecha de inicio ya haya pasado o sea hoy
  for v_rec in 
    select * from public.recurrent_operations 
    where is_active = true 
      and start_date <= current_date
  loop
    v_is_due := false;

    -- Evaluar la condición temporal según la frecuencia
    if v_rec.frequency = 'weekly' then
      -- Se ejecuta si han pasado un múltiplo exacto de 7 días desde el start_date
      if (current_date - v_rec.start_date) >= 0 and ((current_date - v_rec.start_date) % 7 = 0) then
        v_is_due := true;
      end if;

    elsif v_rec.frequency = 'monthly' then
      -- Comprobamos si hoy coincide con el día del mes de la fecha de inicio
      v_last_day_of_month := extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'));
      
      if extract(day from current_date) = extract(day from v_rec.start_date)
         -- Caso especial: si el start_date era 31 y este mes solo tiene 30 días (o febrero 28/29), se ejecuta el último día del mes
         or (extract(day from v_rec.start_date) > v_last_day_of_month 
             and extract(day from current_date) = v_last_day_of_month) then
        v_is_due := true;
      end if;

    elsif v_rec.frequency = 'yearly' then
      -- Se ejecuta si coincide el mes y el día con la fecha de inicio
      if extract(month from current_date) = extract(month from v_rec.start_date)
         and extract(day from current_date) = extract(day from v_rec.start_date) then
        v_is_due := true;
      end if;
    end if;

    -- Si cumple la condición temporal, añadimos la operación
    if v_is_due then
      perform public.add_operation(
        p_type := v_rec.type,
        p_amount := v_rec.amount,
        p_source_id := v_rec.source_id,
        p_destination_source_id := v_rec.destination_source_id,
        p_category_id := coalesce(v_rec.category, 'desconocido'),
        p_subcategory_id := v_rec.subcategory,
        p_date := current_date,
        p_description := coalesce(v_rec.description, 'Operación recurrente automática'),
        p_created_by := v_rec.user_id
      );
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."process_recurrent_operations"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."operations" (
    "id" bigint NOT NULL,
    "type" "public"."operation_type" DEFAULT 'expense'::"public"."operation_type" NOT NULL,
    "amount" numeric NOT NULL,
    "source_id" bigint NOT NULL,
    "destination_source_id" bigint,
    "category" "text",
    "subcategory" "text",
    "date" "date" NOT NULL,
    "creation_date" timestamp without time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."operations" OWNER TO "postgres";


COMMENT ON TABLE "public"."operations" IS 'Registro de operaciones realizadas';



ALTER TABLE "public"."operations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."operations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurrent_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."operation_type" NOT NULL,
    "amount" numeric NOT NULL,
    "source_id" bigint NOT NULL,
    "destination_source_id" bigint,
    "category" "text" NOT NULL,
    "subcategory" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "frequency" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."recurrent_operations" OWNER TO "postgres";


COMMENT ON TABLE "public"."recurrent_operations" IS 'Lista de operaciones recurrentes guardadas';



CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "balance" numeric NOT NULL,
    "description" "text",
    "owner" "uuid"
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."sources" IS 'Cuentaws de banco y efectivo';



ALTER TABLE "public"."sources" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sources_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "default_source_id" bigint NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."operations"
    ADD CONSTRAINT "operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurrent_operations"
    ADD CONSTRAINT "recurrent_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."operations"
    ADD CONSTRAINT "operations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."operations"
    ADD CONSTRAINT "operations_destination_source_id_fkey" FOREIGN KEY ("destination_source_id") REFERENCES "public"."sources"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."operations"
    ADD CONSTRAINT "operations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."recurrent_operations"
    ADD CONSTRAINT "recurrent_operations_destination_source_id_fkey" FOREIGN KEY ("destination_source_id") REFERENCES "public"."sources"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."recurrent_operations"
    ADD CONSTRAINT "recurrent_operations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."recurrent_operations"
    ADD CONSTRAINT "recurrent_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_default_source_id_fkey" FOREIGN KEY ("default_source_id") REFERENCES "public"."sources"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "get_allowed_operations" ON "public"."operations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sources" "s"
  WHERE (("s"."id" = "operations"."source_id") AND (("s"."owner" IS NULL) OR ("s"."owner" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sources" "s"
  WHERE (("s"."id" = "operations"."source_id") AND (("s"."owner" IS NULL) OR ("s"."owner" = "auth"."uid"()))))));



CREATE POLICY "get_allowed_recurrent_operations" ON "public"."recurrent_operations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."sources" "s"
  WHERE (("s"."id" = "recurrent_operations"."source_id") AND (("s"."owner" IS NULL) OR ("s"."owner" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sources" "s"
  WHERE (("s"."id" = "recurrent_operations"."source_id") AND (("s"."owner" IS NULL) OR ("s"."owner" = "auth"."uid"()))))));



CREATE POLICY "get_allowed_sources" ON "public"."sources" TO "authenticated" USING ((("owner" IS NULL) OR ("owner" = "auth"."uid"()))) WITH CHECK ((("owner" IS NULL) OR ("owner" = "auth"."uid"())));



CREATE POLICY "get_users" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurrent_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."add_operation"("p_type" "public"."operation_type", "p_amount" numeric, "p_source_id" integer, "p_destination_source_id" integer, "p_category_id" "text", "p_subcategory_id" "text", "p_date" "date", "p_description" "text", "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_operation"("p_type" "public"."operation_type", "p_amount" numeric, "p_source_id" integer, "p_destination_source_id" integer, "p_category_id" "text", "p_subcategory_id" "text", "p_date" "date", "p_description" "text", "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_operation"("p_type" "public"."operation_type", "p_amount" numeric, "p_source_id" integer, "p_destination_source_id" integer, "p_category_id" "text", "p_subcategory_id" "text", "p_date" "date", "p_description" "text", "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_recurrent_operations"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_recurrent_operations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_recurrent_operations"() TO "service_role";
























GRANT ALL ON TABLE "public"."operations" TO "anon";
GRANT ALL ON TABLE "public"."operations" TO "authenticated";
GRANT ALL ON TABLE "public"."operations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."operations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."operations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."operations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recurrent_operations" TO "anon";
GRANT ALL ON TABLE "public"."recurrent_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."recurrent_operations" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sources_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sources_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sources_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































