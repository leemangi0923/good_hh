from heapq import *
X=99
R=(6,7,8,11,12,13,16,17,18)
p=[
X,1,12,6,X,
4,14,0,0,11,
10,14,13,13,7,
3,0,0,0,8,
X,9,5,2,X,
X,0,0,0,X,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
X,0,0,0,X
]
e=[
X,7,11,3,X,
12,0,13,13,2,
5,14,0,0,6,
9,14,0,0,8,
X,4,1,10,X,
X,0,0,0,X,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
X,0,0,0,X
]
def jjs(ast,dxx):
    if ast[dxx] in (13,14):
        cs=[dxx,dxx+(1 if ast[dxx]==13 else 5)]
        if any(ast[i+25] for i in cs):return []
    mapp={dxx:None}
    move=[dxx]
    p=[0]*50
    for dex in move:
        for j in (1,-1,5,-5):
            dif=dex+j
            if (not -1<dif<50) or dex//25!=dif//25 or (abs(j)==1 and dex//5!=dif//5):continue
            if ast[dxx] in (13,14):
                to=[i+dif-dxx for i in cs]
                if any(i not in R or ast[i] not in (0,ast[dxx]) for i in to):continue
            elif dex>25:
                if dif-25 not in R:dif-=25
                elif ast[dif-25] not in (13,14):continue
            else:
                if dif in R:
                    if ast[dif] in (13,14):dif+=25
                    elif ast[dif]==0:continue
            if dif>=50 or (ast[dxx]<13 and ast[dif]) or dif in mapp:continue
            mapp[dif]=dex
            move+=[dif]
            p[dif]=1
    drs=[]
    for i in [i for i in range(50) if p[i]]:
        load=[]
        while mapp[i]!=None:
            load+=[[i,mapp[i]]]
            i=mapp[i]
        bw=0
        rou=[]
        for fr,ba in load:
            if rou and rou[-1]==fr:
                if bw==fr-ba:rou[-1]=ba
                else: rou+=[ba]
            else: rou=[fr,ba]
            bw=fr-ba
        drs.append([rou[0],rou[::-1]])
    return drs

def main(st,end):
    mapp={st:0}
    load=[(0,0,st)]
    while load:
        h,g,ast=heappop(load)
        g+=1
        move=[ast.index(i) for i in range(1,15)]
        for dex in move:
            for dif,sw in jjs(ast,dex):
                asd=list(ast)
                cs=[dex] if ast[dex]<13 else [dex,dex+(1 if ast[dex]==13 else 5)]
                for i in cs:asd[i]=0
                for i in cs:asd[i+dif-dex]=ast[dex]
                asd=tuple(asd)
                if asd not in mapp:
                    mapp[asd]=ast,sw
                    h=0
                    for i in range(1,15):
                        f,e=asd.index(i)%25,end.index(i)%25
                        if f!=e:
                            h+=(abs(f//5-e//5)+abs(f%5-e%5))*0.7265625
                    if asd==end:
                        print(len(mapp))
                        load=[]
                        while mapp[asd]:
                            asd,sw=mapp[asd]
                            load.append(sw)
                        return load[::-1]
                    heappush(load,(g+h,g,asd))
m=main(tuple(p),tuple(e))
print(len(m))
print(m)
