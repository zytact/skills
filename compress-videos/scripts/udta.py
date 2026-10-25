"""Copy moov/udta child atoms that exist in SRC but not in DST. DST's moov must be the last top-level box."""
import struct, sys

def boxes(buf, start, end):
    pos = start
    while pos + 8 <= end:
        size, typ = struct.unpack_from('>I4s', buf, pos); hdr = 8
        if size == 1: size = struct.unpack_from('>Q', buf, pos + 8)[0]; hdr = 16
        elif size == 0: size = end - pos
        yield typ, pos, hdr, size
        pos += size

def top_moov(path):
    with open(path, 'rb') as f: data = f.read()
    for typ, pos, hdr, size in boxes(data, 0, len(data)):
        if typ == b'moov': return data, pos, hdr, size
    sys.exit(f'no moov in {path}')

def udta(buf, mpos, mhdr, msize):
    return next(((p, h, s) for t, p, h, s in boxes(buf, mpos + mhdr, mpos + msize) if t == b'udta'), None)

src, dst = sys.argv[1], sys.argv[2]
sbuf, *smoov = top_moov(src)
su = udta(sbuf, *smoov)
if not su: sys.exit(0)
dbuf, mpos, mhdr, msize = top_moov(dst)
if mpos + msize != len(dbuf): sys.exit(f'{dst}: moov is not the last box')
du = udta(dbuf, mpos, mhdr, msize)
have = {t for t, *_ in boxes(dbuf, du[0] + du[1], du[0] + du[2])} if du else set()
extra = b''.join(sbuf[p:p + s] for t, p, h, s in boxes(sbuf, su[0] + su[1], su[0] + su[2]) if t not in have)
if not extra: sys.exit(0)
if mhdr != 8 or (du and du[1] != 8): sys.exit('64-bit box sizes not supported')
if du:  # grow existing udta in place
    up, _, us = du
    out = dbuf[mpos:up] + struct.pack('>I', us + len(extra)) + dbuf[up + 4:up + us] + extra + dbuf[up + us:]
else:   # append a new udta at the end of moov
    out = dbuf[mpos:] + struct.pack('>I4s', 8 + len(extra), b'udta') + extra
out = struct.pack('>I', len(out)) + out[4:]
with open(dst, 'r+b') as f:
    f.seek(mpos); f.write(out)
print('copied udta atoms:', [t.decode('latin1') for t, *_ in boxes(extra, 0, len(extra))])
