router.get("/", authMiddleware, pinMiddleware, async (req, res) => {
  const data = await getKeysService();
  res.json({ ok: true, data });
});

router.post("/", authMiddleware, pinMiddleware, async (req, res) => {
  const id = await createKeyService(req.body);
  res.json({ ok: true, id });
});