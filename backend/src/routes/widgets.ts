import express from 'express';

const router = express.Router();

router.get('/metrics', (req, res) => {
  // Mock data as requested
  const cpu = Math.floor(Math.random() * 100);
  const ram = Math.floor(Math.random() * 100);
  const disk = Math.floor(Math.random() * 100);

  res.json({
    cpu: { value: cpu, unit: '%' },
    ram: { value: ram, unit: '%' },
    disk: { value: disk, unit: '%' },
  });
});

export default router;
