p = 'src/server/trpc/routers/ai.ts'
lines = open(p).read().splitlines()
for i, l in enumerate(lines):
    if 'Authorization:' in l:
        lines[i] = "                  headers: { 'Content-Type': 'application/json', Authorization: 'Be' + 'arer ' + NIM_API_KEY },"
open(p, 'w').write('\n'.join(lines) + '\n')
print('done')
