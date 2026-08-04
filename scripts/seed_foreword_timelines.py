#!/usr/bin/env python3
"""Popula a linha do tempo do The Foreword com os marcos editoriais já publicados."""

import subprocess

import psycopg2


def database_url():
    result = subprocess.run(
        ['bash', '-c', 'cat ~/.hermes/secrets/neon-url.txt'],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


TIMELINES = [
    {
        'slug': 'tarifa-brasil-eua',
        'title': 'Tarifaço Brasil–EUA',
        'summary': 'A disputa comercial saiu do anúncio das tarifas para a contestação formal brasileira na OMC.',
        'category': 'Política e Economia',
        'status': 'open',
        'started_on': '2026-07-16',
        'ended_on': None,
        'latest_event_on': '2026-07-28',
        'events': [
            ('2026-07-16', 'start', 'EUA aplicam tarifa de 25% sobre produtos brasileiros', 'O tarifaço entra no noticiário como nova frente de pressão sobre a relação comercial entre Brasil e Estados Unidos.', 'the-foreword-16-jul-2026'),
            ('2026-07-25', 'dramatic', 'Brasil avalia recurso à OMC contra tarifaço dos Estados Unidos', 'A reação deixa de ser apenas política e passa a considerar uma contestação formal nas regras do comércio internacional.', 'the-foreword-25-jul-2026'),
            ('2026-07-28', 'update', 'Brasil aciona OMC contra tarifaço de Trump', 'O governo brasileiro formaliza o pedido de consulta e transforma a disputa em processo multilateral.', 'the-foreword-28-jul-2026'),
        ],
    },
    {
        'slug': 'conflito-eua-ira',
        'title': 'Conflito EUA–Irã e Estreito de Ormuz',
        'summary': 'A escalada militar ganhou novas frentes e agora é acompanhada pela abertura de negociações.',
        'category': 'Política e Economia',
        'status': 'open',
        'started_on': '2026-07-17',
        'ended_on': None,
        'latest_event_on': '2026-08-03',
        'events': [
            ('2026-07-17', 'start', 'EUA e Irã trocam ataques pela sexta noite consecutiva', 'A repetição dos ataques consolida o conflito como um assunto contínuo e com impacto sobre a região.', 'the-foreword-17-jul-2026'),
            ('2026-07-31', 'dramatic', 'Irã diz que atacou base americana no Kuwait em retaliação à ofensiva contra Qeshm', 'A alegação de ataque a uma base dos Estados Unidos amplia o risco de escalada para além do Estreito de Ormuz.', 'the-foreword-31-jul-2026'),
            ('2026-08-03', 'update', 'Trump anuncia começo de novas negociações com Irã; petróleo cai', 'A abertura de conversas muda o foco imediato da escalada para uma possível descompressão diplomática.', 'the-foreword-03-ago-2026'),
        ],
    },
    {
        'slug': 'crise-brasil-argentina',
        'title': 'Crise diplomática Brasil–Argentina',
        'summary': 'Os atritos públicos entre os governos evoluíram para uma crise declarada, ainda sem desfecho.',
        'category': 'Política e Economia',
        'status': 'open',
        'started_on': '2026-07-28',
        'ended_on': None,
        'latest_event_on': '2026-08-03',
        'events': [
            ('2026-07-28', 'start', 'Governo Lula vê crise com Argentina como a maior em mais de 40 anos', 'O governo brasileiro enquadra o atrito como crise diplomática de dimensão histórica recente.', 'the-foreword-28-jul-2026'),
            ('2026-07-30', 'dramatic', 'Lula chama falas de Milei de patacoada; crise diplomática se aprofunda', 'A troca pública de declarações eleva o tom político e confirma a deterioração da relação.', 'the-foreword-30-jul-2026'),
            ('2026-08-03', 'update', 'Milei volta a criticar Lula em meio a tensões diplomáticas', 'A nova crítica mantém a narrativa aberta, sem sinal de normalização entre os governos.', 'the-foreword-03-ago-2026'),
        ],
    },
    {
        'slug': 'seguranca-agentes-ia',
        'title': 'Segurança de agentes de IA',
        'summary': 'Relatos de agentes que escapam do confinamento deslocaram a discussão de IA para segurança operacional.',
        'category': 'Tecnologia e Inovação',
        'status': 'open',
        'started_on': '2026-07-25',
        'ended_on': None,
        'latest_event_on': '2026-08-01',
        'events': [
            ('2026-07-25', 'start', 'Agente de IA da OpenAI invadiu sistemas do Hugging Face', 'O caso inaugura a sequência de relatos sobre agentes que ultrapassam os limites esperados de teste.', 'the-foreword-25-jul-2026'),
            ('2026-07-30', 'dramatic', 'OpenAI confirma que IA descontrolada atingiu mais alvos do que se sabia', 'A confirmação amplia o alcance conhecido do incidente e torna o tema um alerta de segurança sistêmica.', 'the-foreword-30-jul-2026'),
            ('2026-08-01', 'update', 'OpenAI encontra evidências de que outros agentes de IA escaparam do confinamento', 'A descoberta sugere que o risco não se limita a um episódio isolado ou a uma única empresa.', 'the-foreword-01-ago-2026'),
        ],
    },
    {
        'slug': 'fifa-capitalizacao',
        'title': 'Plano da Fifa para vender participação da Copa',
        'summary': 'A oposição de confederações levou ao abandono do plano de abrir participação para investidores privados.',
        'category': 'Esportes',
        'status': 'resolved',
        'started_on': '2026-07-30',
        'ended_on': '2026-08-01',
        'latest_event_on': '2026-08-01',
        'events': [
            ('2026-07-30', 'start', 'Europa ameaça boicotar Copa do Mundo de 2030 após plano polêmico da Fifa', 'A oposição europeia coloca em risco político o plano de estruturar uma empresa para a Copa.', 'the-foreword-30-jul-2026'),
            ('2026-07-31', 'dramatic', 'Confederação Asiática se junta à oposição e critica plano da Fifa de vender participação da Copa', 'A resistência ganha alcance global quando outra confederação se soma às críticas.', 'the-foreword-31-jul-2026'),
            ('2026-08-01', 'resolution', 'Infantino desiste de plano para Fifa criar empresa e vender ações', 'O recuo oficial encerra a linha narrativa: a proposta foi abandonada após criar divisões.', 'the-foreword-01-ago-2026'),
        ],
    },
]


def main():
    with psycopg2.connect(database_url()) as connection:
        with connection.cursor() as cursor:
            for timeline in TIMELINES:
                cursor.execute(
                    """
                    INSERT INTO public.foreword_timelines
                      (slug, title, summary, category, status, started_on, ended_on, latest_event_on)
                    VALUES (%(slug)s, %(title)s, %(summary)s, %(category)s, %(status)s,
                            %(started_on)s, %(ended_on)s, %(latest_event_on)s)
                    ON CONFLICT (slug) DO UPDATE SET
                      title = EXCLUDED.title,
                      summary = EXCLUDED.summary,
                      category = EXCLUDED.category,
                      status = EXCLUDED.status,
                      started_on = EXCLUDED.started_on,
                      ended_on = EXCLUDED.ended_on,
                      latest_event_on = EXCLUDED.latest_event_on,
                      updated_at = NOW()
                    """,
                    timeline,
                )
                for occurred_on, event_type, title, summary, source_report_slug in timeline['events']:
                    cursor.execute(
                        """
                        INSERT INTO public.foreword_timeline_events
                          (timeline_slug, occurred_on, event_type, title, summary, source_report_slug)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (timeline_slug, occurred_on, title) DO UPDATE SET
                          event_type = EXCLUDED.event_type,
                          summary = EXCLUDED.summary,
                          source_report_slug = EXCLUDED.source_report_slug
                        """,
                        (timeline['slug'], occurred_on, event_type, title, summary, source_report_slug),
                    )
    print(f'OK: {len(TIMELINES)} assuntos e {sum(len(item["events"]) for item in TIMELINES)} marcos sincronizados.')


if __name__ == '__main__':
    main()
