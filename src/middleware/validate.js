function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = firstError.path?.join('.');
      const message = field ? `${field}: ${firstError.message}` : firstError.message;
      return res.status(400).json({ success: false, message });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
