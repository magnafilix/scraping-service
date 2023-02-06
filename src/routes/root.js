const rootController = require('../controllers/root')
const { validateUrl } = require('../middlewares/validate')

module.exports = router => {
  router.get('/', validateUrl, rootController.getUrl)
}