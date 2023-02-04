const rootController = require('../controllers/root')

module.exports = router => {
  router.get('/', rootController.getUrl)
}