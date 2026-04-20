--
-- PostgreSQL database dump
--

\restrict IQHe2QTSyOQ6przVNeWmZ9mh9KSScalI8lEubQkSAw7E6hEySH1j4cSqRtOqzEu

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bitacora_accesos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bitacora_accesos (
    id bigint NOT NULL,
    identificador character varying(64),
    id_rostro_coincidente character varying(64),
    motivo text NOT NULL,
    similitud numeric(5,4),
    exito boolean DEFAULT false NOT NULL,
    id_usuario integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bitacora_accesos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bitacora_accesos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bitacora_accesos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bitacora_accesos_id_seq OWNED BY public.bitacora_accesos.id;


--
-- Name: estado_acceso_biometrico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estado_acceso_biometrico (
    id smallint NOT NULL,
    activo boolean DEFAULT false NOT NULL,
    metodo character varying(20) DEFAULT 'fingerprint'::character varying NOT NULL,
    origen character varying(40) DEFAULT 'mobile-app'::character varying NOT NULL,
    autorizado_en timestamp with time zone,
    expira_en timestamp with time zone,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT estado_acceso_biometrico_id_check CHECK ((id = 1))
);


--
-- Name: estado_chapas_inteligentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estado_chapas_inteligentes (
    id smallint NOT NULL,
    nombre_modulo character varying(180) DEFAULT 'Modulo Docente'::character varying NOT NULL,
    accion character varying(40) DEFAULT 'disable_smart_locks'::character varying NOT NULL,
    metodo_autenticacion character varying(20),
    registro_operador character varying(64),
    nombre_operador character varying(180),
    chapas_encendidas boolean DEFAULT false NOT NULL,
    modo_inteligente_habilitado boolean DEFAULT false NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT estado_chapas_inteligentes_id_check CHECK ((id = 1))
);


--
-- Name: estado_sesion_movil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estado_sesion_movil (
    clave_sesion character varying(128) NOT NULL,
    usuario_id character varying(64),
    registro character varying(64),
    id_dispositivo character varying(128),
    activo boolean DEFAULT true NOT NULL,
    origen character varying(40) DEFAULT 'mobile-app'::character varying NOT NULL,
    motivo_cierre_sesion character varying(120),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios (
    id integer NOT NULL,
    id_materia integer NOT NULL,
    lunes character varying(40),
    martes character varying(40),
    miercoles character varying(40),
    jueves character varying(40),
    viernes character varying(40),
    sabado character varying(40),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horarios_id_seq OWNED BY public.horarios.id;


--
-- Name: materias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materias (
    id integer NOT NULL,
    sigla character varying(20) NOT NULL,
    grupo character varying(20) NOT NULL,
    nombre_materia character varying(180) NOT NULL,
    id_docente integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: materias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: materias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materias_id_seq OWNED BY public.materias.id;


--
-- Name: reportes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes (
    id bigint NOT NULL,
    registro_reportante character varying(64) NOT NULL,
    nombre_reportante character varying(180),
    tipo_problema character varying(120) NOT NULL,
    estado_problema character varying(120) NOT NULL,
    prioridad character varying(60) NOT NULL,
    descripcion text NOT NULL,
    imagen_evidencia_base64 text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reportes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportes_id_seq OWNED BY public.reportes.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    ci character varying(64) NOT NULL,
    registro character varying(64) NOT NULL,
    nombre character varying(120) NOT NULL,
    apellido character varying(120) NOT NULL,
    correo character varying(180) NOT NULL,
    hash_contrasena text,
    rol character varying(80) DEFAULT 'Sin asignar'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    id_rostro_externo character varying(64),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: bitacora_accesos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacora_accesos ALTER COLUMN id SET DEFAULT nextval('public.bitacora_accesos_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Name: materias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materias ALTER COLUMN id SET DEFAULT nextval('public.materias_id_seq'::regclass);


--
-- Name: reportes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes ALTER COLUMN id SET DEFAULT nextval('public.reportes_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: bitacora_accesos bitacora_accesos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacora_accesos
    ADD CONSTRAINT bitacora_accesos_pkey PRIMARY KEY (id);


--
-- Name: estado_acceso_biometrico estado_acceso_biometrico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado_acceso_biometrico
    ADD CONSTRAINT estado_acceso_biometrico_pkey PRIMARY KEY (id);


--
-- Name: estado_chapas_inteligentes estado_chapas_inteligentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado_chapas_inteligentes
    ADD CONSTRAINT estado_chapas_inteligentes_pkey PRIMARY KEY (id);


--
-- Name: estado_sesion_movil estado_sesion_movil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado_sesion_movil
    ADD CONSTRAINT estado_sesion_movil_pkey PRIMARY KEY (clave_sesion);


--
-- Name: horarios horarios_id_materia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_id_materia_key UNIQUE (id_materia);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: materias materias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_pkey PRIMARY KEY (id);


--
-- Name: materias materias_sigla_grupo_id_docente_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_sigla_grupo_id_docente_key UNIQUE (sigla, grupo, id_docente);


--
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_ci_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_ci_key UNIQUE (ci);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_id_rostro_externo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rostro_externo_key UNIQUE (id_rostro_externo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_registro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_registro_key UNIQUE (registro);


--
-- Name: idx_bitacora_accesos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bitacora_accesos_created_at ON public.bitacora_accesos USING btree (creado_en DESC);


--
-- Name: idx_bitacora_accesos_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bitacora_accesos_identifier ON public.bitacora_accesos USING btree (identificador);


--
-- Name: idx_estado_sesion_movil_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estado_sesion_movil_registro ON public.estado_sesion_movil USING btree (registro);


--
-- Name: idx_materias_id_docente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materias_id_docente ON public.materias USING btree (id_docente);


--
-- Name: idx_reportes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reportes_created_at ON public.reportes USING btree (creado_en DESC);


--
-- Name: bitacora_accesos bitacora_accesos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bitacora_accesos
    ADD CONSTRAINT bitacora_accesos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: horarios horarios_id_materia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materias(id) ON DELETE CASCADE;


--
-- Name: materias materias_id_docente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materias
    ADD CONSTRAINT materias_id_docente_fkey FOREIGN KEY (id_docente) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IQHe2QTSyOQ6przVNeWmZ9mh9KSScalI8lEubQkSAw7E6hEySH1j4cSqRtOqzEu

