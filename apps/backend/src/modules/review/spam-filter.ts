/**
 * Filtre automatique appliqué à la soumission d'un avis — repère les
 * signaux structurels de spam plutôt qu'une liste de mots interdits (plus
 * fiable, moins de faux positifs sur un avis négatif mais légitime).
 * Inspiré des signaux publiquement documentés par Amazon/Google Play :
 * liens, contenu promotionnel, quasi-vide, répétitions excessives.
 *
 * Un avis signalé n'est jamais supprimé automatiquement — il passe juste
 * en file de modération ("flagged") pour un examen humain, plutôt que
 * d'être publié ou rejeté à l'aveugle.
 *
 * À ajuster/étoffer librement (ex. ajouter une liste de mots pour
 * l'injure, si besoin) — c'est un point de départ raisonnable, pas une
 * solution complète.
 */
export function shouldFlagReview(comment: string | null | undefined): {
  flagged: boolean
  reason?: string
} {
  if (!comment) return { flagged: false }

  const text = comment.trim()

  const hasUrl = /https?:\/\/|www\.|\.(com|net|org|cm|africa)\b/i.test(text)
  if (hasUrl) return { flagged: true, reason: "lien détecté" }

  const hasPhoneOrContact = /(\+?\d[\d\s.-]{7,})|whatsapp|telegram/i.test(text)
  if (hasPhoneOrContact) return { flagged: true, reason: "coordonnées détectées" }

  const isMostlyCaps =
    text.length > 15 && text.replace(/[^A-ZÀ-Ý]/g, "").length / text.length > 0.7
  if (isMostlyCaps) return { flagged: true, reason: "texte majoritairement en majuscules" }

  const hasExcessiveRepetition = /(.)\1{5,}/.test(text)
  if (hasExcessiveRepetition) return { flagged: true, reason: "répétition excessive" }

  return { flagged: false }
}
