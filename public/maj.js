// Mise à jour automatique de Resist (27/10/2026) : quand une nouvelle version est en ligne,
// la page (ou l'app installée) se recharge d'elle-même au retour dessus et toutes les 3 minutes.
// Si un champ est en cours de saisie, on ne recharge pas : un bandeau propose la mise à jour.
(function () {
  var depart = null, bandeau = null

  function version() {
    return fetch('/api/version', { cache: 'no-store' }).then(function (r) { return r.json() }).then(function (j) { return j.v })
  }

  function enSaisie() {
    return Array.prototype.some.call(document.querySelectorAll('textarea, input:not([type]), input[type=text], input[type=email], input[type=url], input[type=search]'), function (el) {
      return !el.readOnly && el.value.trim() !== ''
    })
  }

  function proposer() {
    if (bandeau) return
    bandeau = document.createElement('button')
    bandeau.textContent = 'Nouvelle version de Resist — toucher pour mettre à jour'
    bandeau.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);padding:10px 16px;border:0;border-radius:12px;background:#4B2AEF;color:#fff;font:600 14px/1.3 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)'
    bandeau.onclick = function () { location.reload() }
    document.body.appendChild(bandeau)
  }

  function verifier() {
    if (document.visibilityState !== 'visible') return
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update() }).catch(function () {})
    version().then(function (v) {
      if (depart === null) { depart = v; return }
      if (v === depart) return
      if (enSaisie()) proposer(); else location.reload()
    }).catch(function () {})
  }

  verifier()
  document.addEventListener('visibilitychange', verifier)
  addEventListener('pageshow', function (e) { if (e.persisted) verifier() })
  setInterval(verifier, 3 * 60 * 1000)
})()
