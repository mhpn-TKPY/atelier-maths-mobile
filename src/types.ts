// Contrat partagé avec l'API atelier-maths (app/api/{chapitres,lecture,correction,push-tokens}).
// Dupliqué volontairement — pas de dépendance package entre les deux dépôts.

export interface ChapitreMeta {
  id: string
  niveau: '5e' | '4e' | '3e'
  titre: string
}

export interface Lecture {
  enonce_reconstruit: string
  travail_eleve_reconstruit: string
  confiance_lecture: 'haute' | 'moyenne' | 'faible'
  points_incertains: string[]
}
