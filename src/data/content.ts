export type QuestionKind = 'text' | 'textarea' | 'choice'

export interface Question {
  n: 1 | 2 | 3
  kind: QuestionKind
  text: string
  placeholder?: string
}

export const QUESTIONS: Question[] = [
  { n: 1, kind: 'text', text: 'Nmde schoolill ninak Ettom miss cheynne entha?', placeholder: 'Write it here…' },
  {
    n: 2,
    kind: 'textarea',
    text: 'Nammal ellarum thammil indarnappol ninak orthirikkan enthellum nalla memories indavulo ath entha?',
    placeholder: 'Take your time…',
  },
  { n: 3, kind: 'choice', text: 'Are you enjoying this little surprise?' },
]

// The letter is shown exactly as written — do not edit spelling, punctuation or line breaks.
export const LETTER = `Heyy Happy birthday deve 🤎

Seriously ennik ninak enta gift thrandenn ariyilla.. Eeeh bdy ninak korrach special ayyikotte.. Ith kanditt ninak entha thonnuann onnum ariyilla .. Jst ennik ninne ippollum ishtnnu ariyikan vendi ayyirunnu.. Pettannu oru reply predishichu onnum alla.... Nammal ithrem nallum contact onnum illarnallo.. Ath chumma ninak sheriyavvillann thonnitta njn message ayyakathe.. Athokke vittere enni eeeh bdyykk nii Nala happy ayyi irrik njan call cheyth budhimuttikkunnilla.. 😁 enthannellum Happy ayyi bdy adich pollikk.. Thank you gurl ith ithrem vayichenu.. 🩵

And Love you🩵

Enni enod ethellum parayan ind call chey

Appo onnude Happy birthday girl🫂🩵`
