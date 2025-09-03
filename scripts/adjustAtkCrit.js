function targetMeanOriginal(M, p) {
  if (M <= 15) {
    return (1 + M) / 2 + p * M;
  }
  const m = Math.floor(M / 2);
  return (m + M) / 2 + p * M;
}

// required crit q to reach mu given integer Mprime
function requiredCrit(mu, Mprime) {
  return (mu - (1 + Mprime) / 2) / Mprime;
}

// compute ideal real-valued M' if we demand q = p
function idealMprimeReal(M, p) {
  if (M <= 15) return M;
  const m = Math.floor(M / 2);
  const num = (m + M) / 2 + p * M - 0.5;
  const denom = 0.5 + p;
  return num / denom;
}

function computeMapping(M, p, opts = {}) {
  const strategy = opts.strategy || 'round-and-adjust';
  const muOrig = targetMeanOriginal(M, p);

  if (M <= 15) {
    // no special halved-min rule, simulation already uses 1..M
    return {
      Mprime: M,
      q: p,
      muOrig,
      MprimeReal: M,
      chosenStrategy: 'no-change',
      note: 'M <= 15, no mapping required'
    };
  }

  const MprimeReal = idealMprimeReal(M, p);
  const baseCand = Math.max(1, Math.round(MprimeReal));
  const maxDelta = typeof opts.maxSearchDelta === 'number' ? opts.maxSearchDelta : 200;

  if (strategy === 'round-and-adjust') {
    const Mprime = baseCand;
    let q = requiredCrit(muOrig, Mprime);
    // clamp q to [0,1] if needed (but if clamped, exact mean won't hold)
    const qclamped = Math.min(1, Math.max(0, q));
    const note = (q < 0 || q > 1)
      ? 'required q outside [0,1] and was clamped; exact mean not achievable with this Mprime'
      : 'exact mean achieved with this integer Mprime by adjusting q';
    return {
      Mprime,
      q: qclamped,
      muOrig,
      MprimeReal,
      chosenStrategy: 'round-and-adjust',
      note
    };
  } else if (strategy === 'keep-crit') {
    // search integers around baseCand for one that yields q in [0,1] and minimizes |q-p|
    let best = null;
    for (let delta = 0; delta <= maxDelta; delta++) {
      for (const sign of delta === 0 ? [0] : [-1, +1]) {
        const cand = baseCand + sign * delta;
        if (cand <= 0) continue;
        const qcand = requiredCrit(muOrig, cand);
        const feasible = (qcand >= 0 && qcand <= 1);
        const dist = Math.abs(qcand - p); // how far from original crit
        const entry = { Mprime: cand, q: qcand, feasible, dist };
        if (best === null) best = entry;
        else {
          // prefer feasible entries, otherwise smaller |q-p|
          if (best.feasible && !entry.feasible) {
            // keep best
          } else if (!best.feasible && entry.feasible) {
            best = entry;
          } else {
            if (entry.dist < best.dist) best = entry;
          }
        }
        if (best && best.feasible && best.dist === 0) break;
      }
      if (best && best.feasible && best.dist === 0) break;
    }

    if (!best) {
      // fallback: use rounded and clamp
      const q = requiredCrit(muOrig, baseCand);
      return {
        Mprime: baseCand,
        q: Math.min(1, Math.max(0, q)),
        muOrig,
        MprimeReal,
        chosenStrategy: 'keep-crit-failed-to-find',
        note: 'no feasible integer Mprime found in search window; returned clamped value'
      };
    } else {
      const note = best.feasible ? 'found integer Mprime with q in [0,1] close to p' : 'no feasible q in [0,1], returning closest';
      return {
        Mprime: best.Mprime,
        q: Math.min(1, Math.max(0, best.q)),
        muOrig,
        MprimeReal,
        chosenStrategy: 'keep-crit',
        note
      };
    }
  } else {
    throw new Error('Unknown strategy: ' + strategy);
  }
}

// small simulator to empirically check means (deterministic RNG seed)
function simulateMean(low, high, critChance, trials = 200000) {
  // simple LCG for deterministic behavior (cryptographic vulnerability)
  let seed = 123456789;
  function rnd() {
    seed = (1103515245 * seed + 12345) >>> 0;
    return seed / 0x100000000;
  }
  function randint(a, b) {
    return a + Math.floor(rnd() * (b - a + 1));
  }

  let sum = 0;
  for (let i = 0; i < trials; i++) {
    const base = randint(low, high);
    let val = base;
    if (rnd() < critChance) val = base + high; // simulator's crit adds +high (Mprime)
    sum += val;
  }
  return sum / trials;
}

function printExample(M, p, strategy = 'round-and-adjust') {
  const res = computeMapping(M, p, { strategy });
  console.log(`M=${M}, p=${(p*100).toFixed(2)}% -> M'=${res.Mprime}, q=${(res.q*100).toFixed(0)}% (strategy=${res.chosenStrategy})`);
  console.log('  muOrig =', res.muOrig, ' MprimeReal =', res.MprimeReal);
  // empirical check
  const lowOrig = M <= 15 ? 1 : Math.floor(M/2);
  const empOrig = simulateMean(lowOrig, M, p, 100000);
  const empNew = simulateMean(1, res.Mprime, res.q, 100000);
  console.log('  empirical mean original:', empOrig.toFixed(6), 'mapped:', empNew.toFixed(6), 'abs diff:', Math.abs(empOrig-empNew).toFixed(6));
  console.log('  note:', res.note);
  console.log('');
}

// examples
/*printExample(5, 0.0);
printExample(15, 0.05);
printExample(16, 0.05);
printExample(17, 0.05);
printExample(10, 1.0);
printExample(20, 1.0);
printExample(40, 0.5);*/