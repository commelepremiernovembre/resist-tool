// Proposition de modification avec ses ajouts en gras (comparaison mot à mot avec le passage cité).
// Les mots retirés du passage cité apparaissent barrés dans <Retraits>.

type Bout = { mot: string; change: boolean }

function comparer(avant: string, apres: string): { a: Bout[]; b: Bout[] } {
  const A = avant.split(/(\s+)/), B = apres.split(/(\s+)/)
  // Plus longue sous-suite commune, mot à mot (les espaces comptent comme des mots, pour garder la mise en page).
  const L = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0))
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const a: Bout[] = [], b: Bout[] = []
  let i = 0, j = 0
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { a.push({ mot: A[i++], change: false }); b.push({ mot: B[j++], change: false }) }
    else if (L[i + 1][j] >= L[i][j + 1]) a.push({ mot: A[i++], change: true })
    else b.push({ mot: B[j++], change: true })
  }
  while (i < A.length) a.push({ mot: A[i++], change: true })
  while (j < B.length) b.push({ mot: B[j++], change: true })
  return { a, b }
}

const blanc = (m: string) => !m.trim()

export function Ajouts({ avant, apres }: { avant: string | null; apres: string }) {
  if (!avant) return <>{apres}</>
  return <>{comparer(avant, apres).b.map((x, k) => (x.change && !blanc(x.mot) ? <strong key={k} className="font-bold text-ink">{x.mot}</strong> : x.mot))}</>
}

export function Retraits({ avant, apres }: { avant: string; apres: string }) {
  return <>{comparer(avant, apres).a.map((x, k) => (x.change && !blanc(x.mot) ? <s key={k}>{x.mot}</s> : x.mot))}</>
}
