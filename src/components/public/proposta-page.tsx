type PropostaPageProps = {
  nome?: string;
  valor?: string;
  idProposta?: string;
  telefone?: string;
  equipamento?: number;
  nomeEquipamento?: string;
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "960px",
  margin: "0 auto",
  padding: "0 20px",
};

const sectionStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "0",
  backgroundColor: "#ffffff",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "960px",
  height: "auto",
  objectFit: "contain",
  display: "block",
};

function renderImageSection(id: string, imageName: string) {
  return (
    <section id={id} style={sectionStyle}>
      <img src={`/proposta/imagens/${imageName}`} alt={`secao ${id}`} style={imageStyle} />
    </section>
  );
}

export function PropostaPage({
  nome = "Visitante",
  valor = "R$ 0,00",
  idProposta = "000000",
  telefone = "(00) 00000-0000",
  equipamento = 0,
  nomeEquipamento = "",
}: PropostaPageProps) {
  void equipamento;
  void nomeEquipamento;

  return (
    <main style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {renderImageSection("sessao-1", "image_01.webp")}

      <section
        id="sessao-2"
        style={{
          ...sectionStyle,
          padding: "40px 0",
        }}
      >
        <div
          style={{
            ...containerStyle,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
            fontFamily: "var(--font-body), sans-serif",
            fontStyle: "italic",
            color: "#333",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#009688",
              marginBottom: "20px",
              textTransform: "capitalize",
              fontStyle: "italic",
            }}
          >
            Ola, {nome}!
          </h2>

          <p
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              lineHeight: "1.6",
            }}
          >
            Parabens! Voce avancou mais uma etapa importante para a realizacao do seu mais novo negocio.
            Vamos te ajudar em todas as fases necessarias para que o seu sonho de empreender se torne
            realidade muito em breve.
          </p>

          <p
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              lineHeight: "1.6",
            }}
          >
            Voce esta a um passo de fazer parte do maior{" "}
            <strong>ECOSSISTEMA DE HIDROSSEMEADURA DO HEMISFERIO SUL, a VERDETEC!</strong>
          </p>
        </div>
      </section>

      <section
        id="sessao-3"
        style={{
          ...sectionStyle,
          padding: "40px 0",
        }}
      >
        <img src="/proposta/imagens/image_02.webp" alt="secao 3" style={imageStyle} />
      </section>

      <section
        id="sessao-4"
        style={{
          ...sectionStyle,
          padding: "40px 0",
        }}
      >
        <img src="/proposta/imagens/image_03.webp" alt="secao 4" style={imageStyle} />
      </section>

      <section
        id="sessao-5"
        style={{
          ...sectionStyle,
          padding: "30px 0",
        }}
      >
        <img src="/proposta/imagens/image_04.webp" alt="secao 5" style={imageStyle} />
      </section>

      <section
        id="sessao-6"
        style={{
          ...sectionStyle,
          padding: "40px 0",
        }}
      >
        <img src="/proposta/imagens/image_05.webp" alt="secao 6" style={imageStyle} />
      </section>

      <section
        id="sessao-8"
        style={{
          ...sectionStyle,
          padding: "30px 0",
        }}
      >
        <div
          style={{
            ...containerStyle,
            textAlign: "center",
            fontFamily: "var(--font-body), sans-serif",
            fontStyle: "italic",
            color: "#333",
          }}
        >
          <p style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", textTransform: "capitalize" }}>
            {nome},
          </p>
          <p style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
            Investimento inicial para o seu novo negocio:
          </p>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>{valor}</p>
        </div>
      </section>

      <section
        id="sessao-9"
        style={{
          ...sectionStyle,
          padding: "30px 0",
        }}
      >
        <img
          src="/proposta/imagens/image_06_assi.webp"
          alt="secao 9"
          style={{
            width: "100%",
            maxWidth: "300px",
            height: "auto",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
        />
      </section>

      <section
        id="sessao-10"
        style={{
          ...sectionStyle,
          padding: "30px 0",
        }}
      >
        <div
          style={{
            ...containerStyle,
            fontFamily: "var(--font-body), sans-serif",
            color: "#333",
          }}
        >
          <ul style={{ fontSize: "14px", lineHeight: "1.6", paddingLeft: "20px", margin: 0 }}>
            <li>Clientes que nao contribuem com o ICMS devem informar a vendedora para insercao dos impostos.</li>
            <li>Orcamento valido por 30 dias.</li>
            <li>O investimento apresentado nao contempla os acessorios opcionais.</li>
            <li>
              Numero de identificacao: <strong>{idProposta}</strong>
            </li>
            <li>
              Numero de telefone do orcamento: <strong>{telefone}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section
        id="sessao-11"
        style={{
          ...sectionStyle,
          padding: "30px 0",
        }}
      >
        <img src="/proposta/imagens/image_07.webp" alt="secao 11" style={imageStyle} />
      </section>
    </main>
  );
}

