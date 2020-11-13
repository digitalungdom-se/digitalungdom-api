db.createUser({
  user: "digitalungdom",
  pwd: "digitalungdom",
  roles: [
    {
      role: "readWrite",
      db: "digitalungdom",
    },
  ],
});
