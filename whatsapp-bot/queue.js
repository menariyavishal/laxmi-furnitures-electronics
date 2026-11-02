/**
 * Sequential Message Queue
 *
 * Prevents Baileys WebSocket media collisions when back-to-back documents
 * (such as Booking Slip PDF + Furniture Tax Invoice PDF) are dispatched concurrently.
 */

let outgoingQueue = Promise.resolve();

function enqueueWhatsappMessage(sendFn) {
  const task = outgoingQueue.then(async () => {
    const result = await sendFn();
    // 2-second cooldown to let WhatsApp media servers process and flush cleanly
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return result;
  });

  // Ensure subsequent tasks execute even if this one errors out
  outgoingQueue = task.catch((err) => {
    console.error('Queue task error:', err.message);
  });

  return task;
}

module.exports = {
  enqueueWhatsappMessage,
};

