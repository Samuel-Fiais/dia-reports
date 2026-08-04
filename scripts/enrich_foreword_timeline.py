#!/usr/bin/env python3
"""Enriquece os marcos históricos do The Foreword com métricas e fonte primária."""

import re
import subprocess

import psycopg2


def database_url():
    result = subprocess.run(
        ['bash', '-c', 'cat ~/.hermes/secrets/neon-url.txt'],
        capture_output=True, text=True, check=True,
    )
    return result.stdout.strip()


# A pontuação é editorial, não uma medida de popularidade: alcance, consequência,
# urgência e persistência. Cada valor foi aplicado ao fato descrito no marco.
EVENT_METRICS = {
    'EUA aplicam tarifa de 25% sobre produtos brasileiros': (82, 'rising', 'global'),
    'Brasil avalia recurso à OMC contra tarifaço dos Estados Unidos': (86, 'rising', 'global'),
    'Brasil aciona OMC contra tarifaço de Trump': (90, 'rising', 'global'),
    'EUA e Irã trocam ataques pela sexta noite consecutiva': (88, 'rising', 'global'),
    'Irã diz que atacou base americana no Kuwait em retaliação à ofensiva contra Qeshm': (97, 'rising', 'global'),
    'Trump anuncia começo de novas negociações com Irã; petróleo cai': (91, 'falling', 'global'),
    'Governo Lula vê crise com Argentina como a maior em mais de 40 anos': (78, 'rising', 'national'),
    'Lula chama falas de Milei de patacoada; crise diplomática se aprofunda': (83, 'rising', 'national'),
    'Milei volta a criticar Lula em meio a tensões diplomáticas': (76, 'stable', 'national'),
    'Agente de IA da OpenAI invadiu sistemas do Hugging Face': (84, 'rising', 'global'),
    'OpenAI confirma que IA descontrolada atingiu mais alvos do que se sabia': (93, 'rising', 'global'),
    'OpenAI encontra evidências de que outros agentes de IA escaparam do confinamento': (89, 'stable', 'global'),
    'Europa ameaça boicotar Copa do Mundo de 2030 após plano polêmico da Fifa': (75, 'rising', 'global'),
    'Confederação Asiática se junta à oposição e critica plano da Fifa de vender participação da Copa': (81, 'rising', 'global'),
    'Infantino desiste de plano para Fifa criar empresa e vender ações': (73, 'falling', 'global'),
}


def primary_source(cursor, report_slug, event_title):
    cursor.execute('SELECT content FROM public.reports WHERE slug = %s', (report_slug,))
    row = cursor.fetchone()
    if not row:
        return None
    for section in row[0].get('body', []):
        for item in section.get('items', []):
            if item.get('title', '').removeprefix('1. ').removeprefix('2. ').removeprefix('3. ').removeprefix('4. ').removeprefix('5. ').removeprefix('6. ').removeprefix('7. ') == event_title:
                text = ' '.join(block.get('text', '') for block in item.get('blocks', []))
                match = re.search(r'\[[^\]]+\]\((https?://[^)]+)\)', text)
                if match:
                    return item.get('badge') or 'Fonte original', match.group(1)
    return None


def main():
    with psycopg2.connect(database_url()) as connection:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE public.foreword_timelines SET category = 'Inteligência Artificial' WHERE slug = 'seguranca-agentes-ia'")
            cursor.execute('SELECT id, title, source_report_slug FROM public.foreword_timeline_events')
            rows = cursor.fetchall()
            updated = 0
            sources = 0
            for event_id, title, report_slug in rows:
                metrics = EVENT_METRICS.get(title)
                if not metrics:
                    continue
                cursor.execute(
                    'UPDATE public.foreword_timeline_events SET impact_score=%s, momentum=%s, scope=%s WHERE id=%s',
                    (*metrics, event_id),
                )
                updated += 1
                if report_slug:
                    source = primary_source(cursor, report_slug, title)
                    if source:
                        outlet, url = source
                        cursor.execute(
                            """INSERT INTO public.foreword_event_sources (event_id, outlet, title, url, source_kind)
                               VALUES (%s, %s, %s, %s, 'primary')
                               ON CONFLICT (event_id, url) DO UPDATE SET outlet=EXCLUDED.outlet, title=EXCLUDED.title""",
                            (event_id, outlet, title, url),
                        )
                        sources += 1
    print(f'OK: {updated} métricas e {sources} fontes primárias sincronizadas.')


if __name__ == '__main__':
    main()
