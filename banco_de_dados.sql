CREATE TABLE cliente (
	id_cliente SERIAL PRIMARY KEY,
	totem VARCHAR(10),
	cpf VARCHAR(11) NOT NULL UNIQUE,
	telefone VARCHAR(11) NOT NULL
);

CREATE TABLE multa (
	id_multa SERIAL PRIMARY KEY,
	hora_inicio TIMESTAMP,
	hora_fim TIMESTAMP NOT NULL,
	valor_por_minuto DECIMAL(10,2) NOT NULL,
	valor_multa DECIMAL(10,2) DEFAULT 0.00,
	total_minutos INT DEFAULT 0
);

CREATE TABLE recarga (
	id_recarga SERIAL PRIMARY KEY,
	cliente_id INT REFERENCES cliente(id_cliente) ON DELETE CASCADE,
	multa_id INT REFERENCES multa(id_multa) ON DELETE CASCADE,
	energia_kw INT NOT NULL,
	custo_kw DECIMAL(10,2) NOT NULL,
	hora_inicio TIMESTAMP NOT NULL,
	hora_fim TIMESTAMP NOT NULL,
	valor_recarga DECIMAL(10,2) NOT NULL,
	valor_total DECIMAL(10,2) NOT NULL
);

CREATE TABLE transacao (
	id_transacao SERIAL PRIMARY KEY,
	recarga_id INT REFERENCES recarga(id_recarga) ON DELETE CASCADE,
	nome_cartao VARCHAR(30),
	numero_cartao VARCHAR(30),
	validade_cartao VARCHAR(6),
	cod_segurança VARCHAR(3),
	metodo_pag VARCHAR(20) NOT NULL,
	cod_transacao VARCHAR(50) UNIQUE
);

CREATE TABLE log_recarga (
	id_log SERIAL PRIMARY KEY,
	operacao VARCHAR(10) NOT NULL,
	data_hora_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id_recarga INT REFERENCES recarga(id_recarga) ON DELETE SET NULL,
	username VARCHAR DEFAULT CURRENT_USER
);

CREATE OR REPLACE VIEW recargas_realizadas AS
SELECT
	recarga.id_recarga,
	cliente.totem,
	cliente.cpf,
	cliente.telefone,
	recarga.energia_kw,
	recarga.hora_inicio,
	recarga.hora_fim,
	recarga.hora_fim - recarga.hora_inicio AS duracao,
	recarga.valor_recarga,
	multa.total_minutos,
	multa.valor_multa,
	recarga.valor_total
FROM 
	recarga
JOIN
	cliente ON recarga.cliente_id = cliente.id_cliente
LEFT JOIN
	multa ON recarga.multa_id = multa.id_multa
ORDER BY
	recarga.hora_inicio, cliente.cpf;

CREATE OR REPLACE FUNCTION log_recarga()
RETURNS TRIGGER AS $$
BEGIN
	IF (TG_OP = 'INSERT') THEN
		INSERT INTO log_recarga (operacao, data_hora_log, id_recarga, username)
		VALUES ('INSERT', CURRENT_TIMESTAMP, NEW.id_recarga, CURRENT_USER);
		RETURN NEW;
	ELSIF (TG_OP = 'UPDATE') THEN
		INSERT INTO log_recarga (operacao, data_hora_log, id_recarga, username)
		VALUES ('UPDATE', CURRENT_TIMESTAMP, NEW.id_recarga, CURRENT_USER);
		RETURN NEW;
	ELSIF (TG_OP = 'DELETE') THEN
		INSERT INTO log_recarga (operacao, data_hora_log, id_recarga, username)
		VALUES('DELETE', CURRENT_TIMESTAMP, OLD.id_recarga, CURRENT_USER);
		RETURN OLD;
	END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_recarga
AFTER INSERT OR UPDATE OR DELETE ON recarga
FOR EACH ROW
EXECUTE FUNCTION log_recarga();

CREATE USER elias WITH PASSWORD 'elias';