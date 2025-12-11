import json
import pathlib

# Load data
shop_path = pathlib.Path(r'C:\Users\sadov\PycharmProjects\productsBit&Shop\shopify_products_with_handle.json')
bitrix_path = pathlib.Path(r'C:\Users\sadov\PycharmProjects\PythonProject\productsBit&Shop\bitrix_products.json')
mapping_path = pathlib.Path(r'C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system\agent_b\mvp_templates\api-services\src\lib\bitrix\skuMapping.json')

shop = json.loads(shop_path.read_text(encoding='utf-8'))
bitrix = json.loads(bitrix_path.read_text(encoding='utf-8'))
mapping = json.loads(mapping_path.read_text(encoding='utf-8'))

# Build mappings
code_to_id = {(b.get('CODE') or '').lower().strip(): int(b['ID']) for b in bitrix if b.get('CODE')}
shop_skus = {p.get('sku', '').strip(): p for p in shop if p.get('sku')}
mapped = set(mapping.keys())
unmapped_items = [(sku, shop_skus[sku]) for sku in shop_skus if sku not in mapped]

print(f'Total unmapped: {len(unmapped_items)}')
print(f'\nChecking handle-based matches...')

potential_matches = []
no_handle = []
no_match = []

for sku, item in unmapped_items:
    handle = (item.get('handle') or '').lower().strip()
    if not handle:
        no_handle.append(sku)
        continue
    
    norm_handle = handle.replace('barefoot-', '')
    pid = code_to_id.get(handle) or code_to_id.get(norm_handle)
    
    if pid:
        potential_matches.append({'sku': sku, 'handle': handle, 'product_id': pid, 'title': item.get('title', '')})
    else:
        no_match.append({'sku': sku, 'handle': handle, 'title': item.get('title', '')})

print(f'\n[OK] Potential handle-based matches: {len(potential_matches)}')
print(f'[NO] No handle: {len(no_handle)}')
print(f'[NO] Handle exists but no Bitrix match: {len(no_match)}')

if potential_matches:
    print(f'\nSample potential matches:')
    for m in potential_matches[:10]:
        print(f"  {m['sku']} -> {m['product_id']} (handle: {m['handle']})")

if no_match:
    print(f'\nSample no-match items:')
    for m in no_match[:10]:
        print(f"  {m['sku']} - handle: {m['handle']} - title: {m['title'][:50]}")

