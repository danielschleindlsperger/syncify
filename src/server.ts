import { app } from './api/app'
const { PORT = 4000 } = process.env

app.listen(PORT, () => {
  console.log([`listening on port ${PORT}`, `http://localhost:${PORT}/graphiql`].join('\n'))
})
